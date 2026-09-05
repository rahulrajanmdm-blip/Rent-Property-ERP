import React, { useState } from 'react';
import {
  X, DollarSign, UserCheck, Users, Plus, CheckCircle, Calendar,
  Receipt, CreditCard, AlertCircle, Trash2, Printer, CheckCircle2,
  UserPlus, Percent
} from 'lucide-react';
import { Lease, IndividualExpenseCharge, RoomOccupant, Tenant } from '../types/erp';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';

interface IndividualExpensesModalProps {
  lease: Lease;
  onClose: () => void;
  onUpdate: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currentUserEmail?: string;
}

export const IndividualExpensesModal: React.FC<IndividualExpensesModalProps> = ({
  lease,
  onClose,
  onUpdate,
  onToast,
  currentUserEmail = 'admin@dreamdwell.com'
}) => {
  const [activeTab, setActiveTab] = useState<'CHARGES' | 'NEW_CHARGE' | 'OCCUPANTS'>('CHARGES');
  const [filterOccupant, setFilterOccupant] = useState<string>('ALL');

  const allTenants = storage.getTenants();

  // New Charge Form
  const occupants: RoomOccupant[] = lease.Occupants && lease.Occupants.length > 0
    ? lease.Occupants
    : [
        {
          Occupant_ID: lease.Tenant_ID,
          Full_Name: lease.Tenant_ID,
          Is_Primary: true,
          Utility_Share_Percentage: 100,
          Charge_Utilities_Individually: true
        }
      ];

  const [chargeForm, setChargeForm] = useState({
    occupantId: occupants[0]?.Occupant_ID || lease.Tenant_ID,
    category: 'Electricity' as IndividualExpenseCharge['Category'],
    description: '',
    amount: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    periodMonth: new Date().toISOString().slice(0, 7)
  });

  // Occupant Management State
  const [showAddOccupant, setShowAddOccupant] = useState(false);
  const [newOccForm, setNewOccForm] = useState({
    selectedTenantId: '',
    fullName: '',
    email: '',
    phone: '',
    sharePercentage: 50
  });

  // Local shares state for inline editing
  const [occupantShares, setOccupantShares] = useState<Record<string, number>>(
    occupants.reduce((acc, o) => ({ ...acc, [o.Occupant_ID]: o.Utility_Share_Percentage || 0 }), {})
  );

  // Payment Recording State
  const [payingCharge, setPayingCharge] = useState<IndividualExpenseCharge | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Interac e-Transfer',
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: ''
  });

  const charges: IndividualExpenseCharge[] = lease.Individual_Expenses || [];

  const filteredCharges = charges.filter(c => {
    if (filterOccupant !== 'ALL' && c.Occupant_ID !== filterOccupant) return false;
    return true;
  });

  const totalBilled = charges.reduce((acc, c) => acc + (c.Amount || 0), 0);
  const totalPaid = charges.reduce((acc, c) => acc + (c.Amount_Paid || 0), 0);
  const totalBalance = charges.reduce((acc, c) => acc + (c.Balance || 0), 0);

  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chargeForm.amount);
    if (isNaN(amt) || amt <= 0) {
      onToast('Please enter a valid positive charge amount.', 'error');
      return;
    }

    const occ = occupants.find(o => o.Occupant_ID === chargeForm.occupantId) || occupants[0];
    const desc = chargeForm.description.trim() || `${chargeForm.category} charge for ${chargeForm.periodMonth}`;

    try {
      AccountingEngine.createIndividualExpenseCharge(
        lease.Lease_ID,
        occ.Occupant_ID,
        occ.Full_Name,
        chargeForm.category,
        amt,
        desc,
        chargeForm.dueDate,
        chargeForm.periodMonth,
        currentUserEmail
      );

      onToast(`Billed $${amt.toFixed(2)} (${chargeForm.category}) to ${occ.Full_Name}`, 'success');
      setChargeForm({
        ...chargeForm,
        description: '',
        amount: ''
      });
      setActiveTab('CHARGES');
      onUpdate();
    } catch (err: any) {
      onToast(err.message || 'Failed to create charge', 'error');
    }
  };

  const handleOpenPayment = (charge: IndividualExpenseCharge) => {
    setPayingCharge(charge);
    setPaymentForm({
      amount: (charge.Balance || charge.Amount).toString(),
      paymentMethod: 'Interac e-Transfer',
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: `EFT-${Date.now().toString().slice(-6)}`
    });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCharge) return;

    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      onToast('Please enter a valid payment amount.', 'error');
      return;
    }

    try {
      AccountingEngine.recordIndividualExpensePayment(
        lease.Lease_ID,
        payingCharge.Charge_ID,
        amt,
        paymentForm.paymentMethod,
        paymentForm.paymentDate,
        paymentForm.reference,
        currentUserEmail
      );

      onToast(`Payment of $${amt.toFixed(2)} recorded for ${payingCharge.Occupant_Name}!`, 'success');
      setPayingCharge(null);
      onUpdate();
    } catch (err: any) {
      onToast(err.message || 'Failed to record payment', 'error');
    }
  };

  const handleAddCoOccupant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOccForm.fullName.trim()) {
      onToast('Please enter the occupant full name.', 'error');
      return;
    }

    let occupantTenantId = newOccForm.selectedTenantId;
    let matchedT = allTenants.find(t => t.Tenant_ID === occupantTenantId);
    if (!matchedT) {
      matchedT = allTenants.find(t => t.Full_Name.toLowerCase() === newOccForm.fullName.trim().toLowerCase());
    }

    if (matchedT) {
      occupantTenantId = matchedT.Tenant_ID;
      const updatedT: Tenant = {
        ...matchedT,
        Current_Property_ID: lease.Property_ID,
        Current_Unit_ID: lease.Unit_ID,
        Current_Space_Name: `${lease.Bedroom_Name || lease.Space_Name} (Co-Occupant)`,
        Status: 'Active'
      };
      storage.updateTenant(updatedT, currentUserEmail);
    } else {
      // Auto-create new tenant in Tenants directory!
      occupantTenantId = 'TEN-' + Date.now().toString(36).toUpperCase();
      const createdT: Tenant = {
        Tenant_ID: occupantTenantId,
        Full_Name: newOccForm.fullName.trim(),
        Email: newOccForm.email.trim() || `${newOccForm.fullName.trim().toLowerCase().replace(/\s+/g, '.')}@occupant.ca`,
        Phone: newOccForm.phone.trim() || 'N/A',
        Emergency_Contact: `Lead Tenant: ${lease.Tenant_ID}`,
        Status: 'Active',
        Current_Property_ID: lease.Property_ID,
        Current_Unit_ID: lease.Unit_ID,
        Current_Space_Name: `${lease.Bedroom_Name || lease.Space_Name} (Co-Occupant)`,
        Created_At: new Date().toISOString().slice(0, 10),
        Notes: `Co-Occupant in ${lease.Bedroom_Name || lease.Space_Name}`
      };
      storage.addTenant(createdT, currentUserEmail);
    }

    const newOcc: RoomOccupant = {
      Occupant_ID: occupantTenantId,
      Full_Name: newOccForm.fullName.trim(),
      Email: newOccForm.email.trim() || undefined,
      Phone: newOccForm.phone.trim() || undefined,
      Is_Primary: false,
      Utility_Share_Percentage: newOccForm.sharePercentage,
      Charge_Utilities_Individually: true,
      Notes: 'Co-Occupant'
    };

    const currentOccs = lease.Occupants && lease.Occupants.length > 0 ? [...lease.Occupants] : [...occupants];
    currentOccs.push(newOcc);
    lease.Occupants = currentOccs;
    lease.Occupants_Count = currentOccs.length;
    lease.Occupancy_Type = `Joint Room (${currentOccs.length} People)`;
    storage.updateLease(lease, currentUserEmail);

    setOccupantShares(prev => ({ ...prev, [newOcc.Occupant_ID]: newOcc.Utility_Share_Percentage || 0 }));
    setNewOccForm({
      selectedTenantId: '',
      fullName: '',
      email: '',
      phone: '',
      sharePercentage: 50
    });
    setShowAddOccupant(false);
    onToast(`Added ${newOcc.Full_Name} as co-occupant to this room!`, 'success');
    onUpdate();
  };

  const handleUpdateOccupantShares = () => {
    if (!lease.Occupants || lease.Occupants.length === 0) return;
    lease.Occupants = lease.Occupants.map(o => ({
      ...o,
      Utility_Share_Percentage: occupantShares[o.Occupant_ID] !== undefined ? occupantShares[o.Occupant_ID] : o.Utility_Share_Percentage
    }));
    storage.updateLease(lease, currentUserEmail);
    onToast('Occupant utility shares updated successfully!', 'success');
    onUpdate();
  };

  const handleRemoveCoOccupant = (occupantId: string) => {
    if (!lease.Occupants) return;
    const target = lease.Occupants.find(o => o.Occupant_ID === occupantId);
    if (target?.Is_Primary) {
      onToast('Cannot remove the primary leaseholder.', 'error');
      return;
    }
    lease.Occupants = lease.Occupants.filter(o => o.Occupant_ID !== occupantId);
    lease.Occupants_Count = lease.Occupants.length;
    storage.updateLease(lease, currentUserEmail);
    onToast(`Removed occupant from room.`, 'info');
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black tracking-tight">Individual Utility & Expense Ledger</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {lease.Occupancy_Type || 'Joint Room'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Tagged Room: <span className="font-semibold text-white">{lease.Bedroom_Name || lease.Space_Name}</span> (Unit {lease.Unit_ID})
              {' · '}Contract Rent: <span className="font-semibold text-emerald-400">${lease.Monthly_Rent}/mo</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Occupants Badge Strip */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Room Occupants:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {occupants.map((occ, idx) => (
                <span
                  key={occ.Occupant_ID || idx}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                    occ.Is_Primary
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  <UserCheck className="w-3 h-3 text-current" />
                  <span>{occ.Full_Name}</span>
                  <span className="text-[10px] opacity-75">
                    ({occ.Is_Primary ? 'Primary' : 'Co-Occupant'} · {occ.Utility_Share_Percentage || 50}%)
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Total Billed</span>
              <span className="text-slate-900">${totalBilled.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Paid</span>
              <span className="text-emerald-700">${totalPaid.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Balance Due</span>
              <span className={totalBalance > 0 ? 'text-rose-700' : 'text-slate-700'}>
                ${totalBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action / View Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('CHARGES')}
              className={`pb-2.5 px-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'CHARGES'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Charges History ({charges.length})
            </button>
            <button
              onClick={() => setActiveTab('NEW_CHARGE')}
              className={`pb-2.5 px-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'NEW_CHARGE'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Bill Individual Expense
            </button>
            <button
              onClick={() => setActiveTab('OCCUPANTS')}
              className={`pb-2.5 px-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'OCCUPANTS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Room Occupants & Shares ({occupants.length})
            </button>
          </div>

          {activeTab === 'CHARGES' && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs text-slate-400 font-semibold">Filter Occupant:</span>
              <select
                value={filterOccupant}
                onChange={(e) => setFilterOccupant(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium"
              >
                <option value="ALL">All Occupants</option>
                {occupants.map(o => (
                  <option key={o.Occupant_ID} value={o.Occupant_ID}>
                    {o.Full_Name} ({o.Is_Primary ? 'Primary' : 'Co-Occupant'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'NEW_CHARGE' && (
            <form onSubmit={handleCreateCharge} className="max-w-2xl mx-auto space-y-4 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  Bill Expense or Utility to Specific Room Occupant
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allows charging utilities (hydro, water, gas, internet) or specific fees to one occupant in this room without impacting the other co-occupants.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Occupant *</label>
                  <select
                    value={chargeForm.occupantId}
                    onChange={(e) => setChargeForm({ ...chargeForm, occupantId: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-indigo-600"
                  >
                    {occupants.map(o => (
                      <option key={o.Occupant_ID} value={o.Occupant_ID}>
                        {o.Full_Name} ({o.Is_Primary ? 'Primary Occupant' : 'Co-Occupant'} · {o.Utility_Share_Percentage || 50}% share)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={chargeForm.category}
                    onChange={(e) => setChargeForm({ ...chargeForm, category: e.target.value as any })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Electricity">Electricity (Hydro)</option>
                    <option value="Water">Water & Sewage</option>
                    <option value="Gas">Gas / Heating</option>
                    <option value="Internet">High-Speed Internet</option>
                    <option value="Cleaning">Cleaning / Housekeeping</option>
                    <option value="Damage">Damage / Room Repair</option>
                    <option value="Key Deposit">Key Deposit / Lockout</option>
                    <option value="Parking">Individual Parking</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Bill ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="e.g. 45.00"
                      value={chargeForm.amount}
                      onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-7 bg-white font-bold focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Month / Period</label>
                  <input
                    type="month"
                    value={chargeForm.periodMonth}
                    onChange={(e) => setChargeForm({ ...chargeForm, periodMonth: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Memo</label>
                  <input
                    type="text"
                    placeholder="e.g. August Hydro share for Master Room occupant"
                    value={chargeForm.description}
                    onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={chargeForm.dueDate}
                    onChange={(e) => setChargeForm({ ...chargeForm, dueDate: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('CHARGES')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Post Individual Charge & GL Entry
                </button>
              </div>
            </form>
          )}

          {activeTab === 'CHARGES' && (
            <div className="space-y-4">
              {filteredCharges.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Individual Expenses Charged Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                    Utilities and expenses can be billed directly to each person in this room. Click "Bill Individual Expense" to add a charge.
                  </p>
                  <button
                    onClick={() => setActiveTab('NEW_CHARGE')}
                    className="mt-3 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    + Add First Charge
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Occupant</th>
                        <th className="p-3">Category & Memo</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3 text-right">Amount ($)</th>
                        <th className="p-3 text-right">Paid ($)</th>
                        <th className="p-3 text-right">Balance ($)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCharges.map(c => {
                        const isPaid = c.Status === 'Paid' || (c.Balance !== undefined && c.Balance <= 0);
                        const isPartial = c.Status === 'Partial' || ((c.Amount_Paid || 0) > 0 && (c.Balance || 0) > 0);

                        return (
                          <tr key={c.Charge_ID} className="hover:bg-slate-50/80">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{c.Occupant_Name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.Charge_ID}</span>
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 mr-1.5">
                                {c.Category}
                              </span>
                              <span className="text-slate-700 font-medium">{c.Description}</span>
                            </td>
                            <td className="p-3 text-slate-500 font-medium">
                              {c.Due_Date}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              ${c.Amount.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-700">
                              ${(c.Amount_Paid || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-extrabold text-slate-900">
                              <span className={(c.Balance || 0) > 0 ? 'text-rose-700' : 'text-slate-400'}>
                                ${(c.Balance || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-block ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {c.Status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {!isPaid && (
                                <button
                                  onClick={() => handleOpenPayment(c)}
                                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
                                >
                                  Collect
                                </button>
                              )}
                              {isPaid && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-0.5">
                                  <CheckCircle className="w-3 h-3" /> Settled
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'OCCUPANTS' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Room Occupancy & Utility Cost Apportionment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage roommates in {lease.Bedroom_Name || lease.Space_Name}. Select from registered tenants or register new roommates.
                  </p>
                </div>
                {!showAddOccupant && (
                  <button
                    onClick={() => setShowAddOccupant(true)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Co-Occupant
                  </button>
                )}
              </div>

              {/* Add Co-Occupant Form */}
              {showAddOccupant && (
                <form onSubmit={handleAddCoOccupant} className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                      Add Roommate / Co-Occupant to {lease.Bedroom_Name || lease.Space_Name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddOccupant(false)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                      Select from Existing Tenants Directory:
                    </label>
                    <select
                      value={newOccForm.selectedTenantId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        if (!sid) {
                          setNewOccForm({
                            ...newOccForm,
                            selectedTenantId: '',
                            fullName: '',
                            email: '',
                            phone: ''
                          });
                        } else {
                          const t = allTenants.find(item => item.Tenant_ID === sid);
                          if (t) {
                            setNewOccForm({
                              ...newOccForm,
                              selectedTenantId: t.Tenant_ID,
                              fullName: t.Full_Name,
                              email: t.Email || '',
                              phone: t.Phone || ''
                            });
                          }
                        }
                      }}
                      className="w-full text-xs p-2 bg-white border border-indigo-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value="">-- Enter New Co-Occupant (Will auto-register as Tenant) --</option>
                      <optgroup label="Registered Tenants">
                        {allTenants
                          .filter(t => !occupants.some(o => o.Occupant_ID === t.Tenant_ID))
                          .map(t => (
                            <option key={t.Tenant_ID} value={t.Tenant_ID}>
                              {t.Full_Name} ({t.Tenant_ID}) · {t.Status} {t.Phone ? `· ${t.Phone}` : ''}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Robin Banks"
                        value={newOccForm.fullName}
                        onChange={(e) => setNewOccForm({ ...newOccForm, fullName: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Email / Interac</label>
                      <input
                        type="email"
                        placeholder="robin@example.ca"
                        value={newOccForm.email}
                        onChange={(e) => setNewOccForm({ ...newOccForm, email: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Phone</label>
                      <input
                        type="text"
                        placeholder="Phone"
                        value={newOccForm.phone}
                        onChange={(e) => setNewOccForm({ ...newOccForm, phone: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Utility Share (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={newOccForm.sharePercentage}
                        onChange={(e) => setNewOccForm({ ...newOccForm, sharePercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-indigo-700">
                      {newOccForm.selectedTenantId
                        ? `✓ Links to existing tenant record ${newOccForm.selectedTenantId}`
                        : `* A new tenant profile will automatically be created in the directory.`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddOccupant(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-white rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                      >
                        Add to Room
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Occupants List */}
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {occupants.map((occ, idx) => {
                  const isPrimary = occ.Is_Primary;
                  const occCharges = charges.filter(c => c.Occupant_ID === occ.Occupant_ID);
                  const occBalance = occCharges.reduce((acc, c) => acc + (c.Balance || 0), 0);
                  const matchedTenant = allTenants.find(t => t.Tenant_ID === occ.Occupant_ID);

                  return (
                    <div key={occ.Occupant_ID} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isPrimary ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{occ.Full_Name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isPrimary ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isPrimary ? 'Lead Leaseholder' : 'Co-Occupant'}
                            </span>
                            {matchedTenant && (
                              <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                ID: {matchedTenant.Tenant_ID}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                            {occ.Email && <span>Email: {occ.Email}</span>}
                            {occ.Phone && <span>Phone: {occ.Phone}</span>}
                            <span className={occBalance > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                              Ledger Balance: ${occBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-500 font-semibold">Utility Share:</label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={occupantShares[occ.Occupant_ID] ?? occ.Utility_Share_Percentage ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setOccupantShares({ ...occupantShares, [occ.Occupant_ID]: val });
                              }}
                              className="w-16 p-1 text-center font-bold text-xs border border-slate-300 rounded-l-md"
                            />
                            <span className="bg-slate-100 border border-l-0 border-slate-300 px-2 py-1 text-xs text-slate-600 rounded-r-md">
                              %
                            </span>
                          </div>
                        </div>

                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCoOccupant(occ.Occupant_ID)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Co-Occupant from Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shares Save Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="text-slate-600">
                  Total Utility Share Allocation:{' '}
                  {(() => {
                    const totalShare = (Object.values(occupantShares) as number[]).reduce((a: number, b: number) => a + Number(b || 0), 0);
                    return (
                      <strong className={Math.abs(totalShare - 100) < 0.1 ? 'text-emerald-700' : 'text-amber-700'}>
                        {totalShare.toFixed(1)}%
                      </strong>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={handleUpdateOccupantShares}
                  className="px-3 py-1.5 font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
                >
                  Save Shares Allocation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Room allocation rule: Group room charges apportion individually while preserving single room booking validity.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

        {/* Payment Recording Dialog */}
        {payingCharge && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Record Occupant Payment</h3>
                </div>
                <button onClick={() => setPayingCharge(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Occupant:</span>
                  <span className="font-bold text-slate-800">{payingCharge.Occupant_Name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Charge:</span>
                  <span className="font-medium text-slate-700">{payingCharge.Category} - {payingCharge.Description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-extrabold text-rose-700">${(payingCharge.Balance || payingCharge.Amount).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={payingCharge.Balance || payingCharge.Amount}
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Interac e-Transfer">Interac e-Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer (EFT)">Bank Transfer (EFT)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Reference code from Interac"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPayingCharge(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                  >
                    Confirm Payment Received
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
