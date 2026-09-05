import React, { useState } from 'react';
import {
  DollarSign, Zap, Plus, Search, Filter, CheckCircle2,
  AlertCircle, ArrowDownRight, RefreshCw, Calendar, Edit3, Trash2, X, Landmark,
  Tag, BadgePercent
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { RentTransaction, User } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { BankPaymentAllocationModal } from './BankPaymentAllocationModal';

interface RentManagementViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RentManagementView: React.FC<RentManagementViewProps> = ({ currentUser, onToast }) => {
  const rents = storage.getRentTransactions();
  const leases = storage.getLeases();
  const properties = storage.getProperties();
  const tenants = storage.getTenants();
  const units = storage.getUnits();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');

  // Generate Rent Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genPropFilter, setGenPropFilter] = useState('');

  // Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocTenantId, setAllocTenantId] = useState<string | undefined>(undefined);
  const [selectedRentTxn, setSelectedRentTxn] = useState<RentTransaction | null>(null);
  const [payForm, setPayForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Interac e-Transfer',
    reference: ''
  });

  // Discount Modal State
  const [selectedDiscountTxn, setSelectedDiscountTxn] = useState<RentTransaction | null>(null);
  const [discountForm, setDiscountForm] = useState<{
    amount: number;
    reason: string;
  }>({
    amount: 0,
    reason: ''
  });

  // Edit / Delete State
  const [editingRent, setEditingRent] = useState<RentTransaction | null>(null);
  const [deletingRent, setDeletingRent] = useState<RentTransaction | null>(null);
  const [editForm, setEditForm] = useState<{
    amountBilled: number;
    discountAmount: number;
    discountReason: string;
    amountPaid: number;
    dueDate: string;
    status: RentTransaction['Status'];
  }>({
    amountBilled: 0,
    discountAmount: 0,
    discountReason: '',
    amountPaid: 0,
    dueDate: '',
    status: 'Unpaid'
  });

  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;
  const tenantName = (id: string) => tenants.find(t => t.Tenant_ID === id)?.Full_Name || id;
  const unitName = (id: string) => units.find(u => u.Unit_ID === id)?.Unit_Number_Name || id;

  const handleRunRentGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = AccountingEngine.generateMonthlyRent(genMonth, genPropFilter || undefined, currentUser.Email);
      if (res.count > 0) {
        onToast(`Generated rent for ${res.count} unit(s) (${res.createdList.join(', ')}).`, 'success');
      } else if (res.skippedList.length > 0) {
        onToast(`Idempotency Check: Rent for ${res.skippedList.length} lease(s) was already generated for ${genMonth}. No duplicates created.`, 'info');
      } else {
        onToast(`No active leases found matching criteria for ${genMonth}.`, 'error');
      }
      setShowGenModal(false);
    } catch (err: any) {
      onToast(err.message || 'Error generating rent', 'error');
    }
  };

  const handleOpenPayModal = (r: RentTransaction) => {
    setSelectedRentTxn(r);
    const netDue = Math.max(0, r.Amount_Billed - (r.Discount_Amount || 0));
    setPayForm({
      amountPaid: r.Balance > 0 ? r.Balance : netDue,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Interac e-Transfer',
      reference: 'EFT-' + Math.floor(100000 + Math.random() * 900000)
    });
    setShowPayModal(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentTxn) return;
    try {
      const res = AccountingEngine.recordRentPayment(
        selectedRentTxn.Rent_Txn_ID,
        payForm.amountPaid,
        payForm.paymentMethod,
        payForm.paymentDate,
        payForm.reference,
        currentUser.Email
      );

      onToast(`Payment of $${payForm.amountPaid} recorded (Collection #${res.collectionId})${res.excess > 0 ? ` with excess of $${res.excess} logged.` : '.'}`, 'success');
      setShowPayModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to record payment', 'error');
    }
  };

  const handleOpenDiscountModal = (r: RentTransaction) => {
    setSelectedDiscountTxn(r);
    setDiscountForm({
      amount: r.Discount_Amount || 0,
      reason: r.Discount_Reason || ''
    });
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscountTxn) return;
    try {
      const discAmt = Number(discountForm.amount) || 0;
      const res = AccountingEngine.applyRentDiscount(
        selectedDiscountTxn.Rent_Txn_ID,
        discAmt,
        discountForm.reason,
        currentUser.Email
      );
      if (discAmt > 0) {
        onToast(`Applied discount of ${AccountingEngine.formatCurrency(discAmt)} to rent txn (${selectedDiscountTxn.Period_Month}). New balance: ${AccountingEngine.formatCurrency(res.balance)}.`, 'success');
      } else {
        onToast(`Cleared discount on rent txn (${selectedDiscountTxn.Period_Month}). Balance restored to ${AccountingEngine.formatCurrency(res.balance)}.`, 'info');
      }
      setSelectedDiscountTxn(null);
    } catch (err: any) {
      onToast(err.message || 'Failed to apply discount.', 'error');
    }
  };

  const handleOpenEditRent = (r: RentTransaction) => {
    setEditingRent(r);
    setEditForm({
      amountBilled: r.Amount_Billed,
      discountAmount: r.Discount_Amount || 0,
      discountReason: r.Discount_Reason || '',
      amountPaid: r.Amount_Paid,
      dueDate: r.Due_Date,
      status: r.Status
    });
  };

  const handleSaveEditRent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRent) return;

    const billed = Number(editForm.amountBilled);
    const discount = Math.max(0, Number(editForm.discountAmount || 0));
    const paid = Number(editForm.amountPaid);
    const netBilled = Math.max(0, billed - discount);
    const balance = Math.max(0, Math.round((netBilled - paid) * 100) / 100);

    const updated: RentTransaction = {
      ...editingRent,
      Amount_Billed: billed,
      Discount_Amount: discount > 0 ? discount : undefined,
      Discount_Reason: discount > 0 ? (editForm.discountReason || 'Monthly rent discount') : undefined,
      Amount_Paid: paid,
      Balance: balance,
      Due_Date: editForm.dueDate,
      Status: editForm.status
    };

    storage.updateRentTransaction(updated, currentUser.Email);

    // Sync double entry GL discount journal if discount changed
    if (discount !== (editingRent.Discount_Amount || 0)) {
      try {
        AccountingEngine.applyRentDiscount(
          editingRent.Rent_Txn_ID,
          discount,
          editForm.discountReason || 'Monthly rent discount',
          currentUser.Email
        );
      } catch (err) {
        console.error('Failed to sync discount GL:', err);
      }
    }

    onToast(`Rent transaction ${updated.Rent_Txn_ID} updated`, 'success');
    setEditingRent(null);
  };

  const handleDeleteRentConfirm = () => {
    if (!deletingRent) return;
    storage.deleteRentTransaction(deletingRent.Rent_Txn_ID, currentUser.Email);
    onToast(`Rent transaction ${deletingRent.Rent_Txn_ID} deleted`, 'info');
    setDeletingRent(null);
  };

  const filteredRents = rents.filter(r => {
    // Exclude orphaned rent transactions whose lease agreement was removed
    if (r.Lease_ID && !leases.some(l => l.Lease_ID === r.Lease_ID)) return false;
    if (statusFilter !== 'ALL' && r.Status !== statusFilter) return false;
    if (propertyFilter !== 'ALL' && r.Property_ID !== propertyFilter) return false;
    return true;
  });

  const totalGrossBilled = filteredRents.reduce((s, r) => s + r.Amount_Billed, 0);
  const totalDiscounts = filteredRents.reduce((s, r) => s + (r.Discount_Amount || 0), 0);
  const totalNetBilled = Math.max(0, totalGrossBilled - totalDiscounts);
  const totalPaid = filteredRents.reduce((s, r) => s + r.Amount_Paid, 0);
  const totalBalance = filteredRents.reduce((s, r) => s + r.Balance, 0);

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Gross Rent Billed</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{AccountingEngine.formatCurrency(totalGrossBilled)}</p>
          {totalDiscounts > 0 && (
            <p className="text-[11px] text-slate-500 mt-0.5">Net Billed: <span className="font-bold text-slate-700">{AccountingEngine.formatCurrency(totalNetBilled)}</span></p>
          )}
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Rent Discounts Granted</p>
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{AccountingEngine.formatCurrency(totalDiscounts)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredRents.filter(r => (r.Discount_Amount || 0) > 0).length} invoice(s) discounted
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Collected</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{AccountingEngine.formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Applied to tenant balances</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Outstanding Rent Due</p>
          <p className="text-xl font-extrabold text-rose-600 mt-1">{AccountingEngine.formatCurrency(totalBalance)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Arrears across active leases</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Rent Roll & Receivables Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Idempotent monthly billing runs, payment allocation, discounts & unearned excess handling</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
            >
              <option value="ALL">All Properties</option>
              {properties.map(p => (
                <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Unpaid">Unpaid Only</option>
              <option value="Partial">Partial Only</option>
              <option value="Paid">Paid Only</option>
            </select>

            <button
              id="btn-allocate-bank-payment"
              onClick={() => {
                setAllocTenantId(undefined);
                setShowAllocModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5" />
              Allocate Bank Payment
            </button>

            <button
              id="btn-generate-rent"
              onClick={() => setShowGenModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Rent Run
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Property & Suite</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Rent Billed</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No rent transactions match filters. Run "Generate Rent Run" to invoice active leases.
                  </td>
                </tr>
              ) : (
                filteredRents.map((r, idx) => (
                  <tr key={`${r.Rent_Txn_ID || 'rent'}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                      {r.Period_Month}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {tenantName(r.Tenant_ID)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-bold text-slate-800">{unitName(r.Unit_ID)}</span> · {propertyName(r.Property_ID)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {r.Due_Date}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.Discount_Amount && r.Discount_Amount > 0 ? (
                        <div>
                          <div className="text-[11px] text-slate-400 line-through">
                            {AccountingEngine.formatCurrency(r.Amount_Billed)}
                          </div>
                          <div className="font-bold text-slate-900">
                            {AccountingEngine.formatCurrency(r.Amount_Billed - r.Discount_Amount)}
                          </div>
                          <div
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5"
                            title={r.Discount_Reason ? `Discount: ${r.Discount_Reason}` : 'Rent discount'}
                          >
                            <Tag className="w-2.5 h-2.5" /> -{AccountingEngine.formatCurrency(r.Discount_Amount)}
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-900">
                          {AccountingEngine.formatCurrency(r.Amount_Billed)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                      {AccountingEngine.formatCurrency(r.Amount_Paid)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${r.Balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {AccountingEngine.formatCurrency(r.Balance)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        r.Status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : r.Status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {r.Status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.Status !== 'Paid' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPayModal(r)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          >
                            Record Rent
                          </button>
                          <button
                            onClick={() => {
                              setAllocTenantId(r.Tenant_ID);
                              setShowAllocModal(true);
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Split bank payment across Rent, LMR, or Deposit"
                          >
                            Allocate
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDiscountModal(r)}
                          className={`p-1.5 rounded transition-colors ${
                            r.Discount_Amount && r.Discount_Amount > 0
                              ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={r.Discount_Amount ? `Edit Discount (-${AccountingEngine.formatCurrency(r.Discount_Amount)})` : 'Apply Rent Discount for this month'}
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditRent(r)}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Rent Transaction"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRent(r)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Rent Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Idempotent Generate Rent Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Generate Monthly Rent Billing</h3>
                <p className="text-xs text-slate-500">Idempotent batch run — duplicate checks enabled</p>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRunRentGeneration} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Billing Month (YYYY-MM)</label>
                <input
                  type="month"
                  required
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Property Scope (Optional)</label>
                <select
                  value={genPropFilter}
                  onChange={(e) => setGenPropFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">All Properties (Global Run)</option>
                  {properties.map(p => (
                    <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name} ({p.Province})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-950 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Idempotent Duplicate Protection:
                </p>
                <p className="text-[11px] text-emerald-900">
                  Any unit that already has a rent charge recorded for <b>{genMonth}</b> will be safely skipped. No duplicate invoices or journals will be generated.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Execute Rent Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rent Transaction Modal */}
      {editingRent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Rent Invoice: {editingRent.Rent_Txn_ID}</h3>
                <p className="text-xs text-slate-500">{tenantName(editingRent.Tenant_ID)} · {editingRent.Period_Month}</p>
              </div>
              <button onClick={() => setEditingRent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRent} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount Billed ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editForm.amountBilled}
                    onChange={(e) => setEditForm({ ...editForm, amountBilled: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount Paid ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editForm.amountPaid}
                    onChange={(e) => setEditForm({ ...editForm, amountPaid: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-bold text-emerald-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div>
                  <label className="font-semibold text-indigo-950 block mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-indigo-600" />
                    Discount ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editForm.discountAmount || ''}
                    onChange={(e) => setEditForm({ ...editForm, discountAmount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full text-xs rounded-xl border border-indigo-200 p-2 outline-none focus:border-indigo-600 bg-white font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-indigo-950 block mb-1">Discount Reason</label>
                  <input
                    type="text"
                    value={editForm.discountReason}
                    onChange={(e) => setEditForm({ ...editForm, discountReason: e.target.value })}
                    placeholder="e.g. Repairs concession"
                    className="w-full text-xs rounded-xl border border-indigo-200 p-2 outline-none focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Net Rent Due:</span>
                  <span className="font-bold text-slate-800">
                    {AccountingEngine.formatCurrency(Math.max(0, editForm.amountBilled - (editForm.discountAmount || 0)))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Calculated Balance:</span>
                  <span className="text-rose-600 font-bold">
                    {AccountingEngine.formatCurrency(Math.max(0, Math.round(((editForm.amountBilled - (editForm.discountAmount || 0)) - editForm.amountPaid) * 100) / 100))}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Apply Rent Discount / Concession Modal */}
      {selectedDiscountTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-indigo-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rent Discount & Concession</h3>
                  <p className="text-xs text-slate-500">
                    {tenantName(selectedDiscountTxn.Tenant_ID)} · {selectedDiscountTxn.Period_Month}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDiscountTxn(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyDiscount} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Billed Rent:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {AccountingEngine.formatCurrency(selectedDiscountTxn.Amount_Billed)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Amount Paid:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {AccountingEngine.formatCurrency(selectedDiscountTxn.Amount_Paid)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Discount Amount ($)</label>
                  <span className="text-[11px] text-slate-400">Decimal values accepted</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={selectedDiscountTxn.Amount_Billed}
                  required
                  value={discountForm.amount || ''}
                  onChange={(e) => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
                  placeholder="0.00 (e.g. 50.00 or 4.04)"
                  className="w-full text-sm rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono font-bold text-indigo-700"
                />

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
                  {[25, 50, 75, 100, 150].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDiscountForm({ ...discountForm, amount: val })}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-medium transition-colors"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Discount Reason / Description</label>
                <input
                  type="text"
                  value={discountForm.reason}
                  onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                  placeholder="e.g. Maintenance inconvenience, Move-in promo, Goodwill"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Maintenance concession', 'Goodwill credit', 'Move-in rebate', 'Referral reward'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDiscountForm({ ...discountForm, reason: r })}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-800 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Calculation Card */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Rent:</span>
                  <span className="font-mono">{AccountingEngine.formatCurrency(selectedDiscountTxn.Amount_Billed)}</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Less Discount (GL 4005):</span>
                  <span className="font-mono">-{AccountingEngine.formatCurrency(discountForm.amount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-indigo-100">
                  <span>Net Rent Payable:</span>
                  <span className="font-mono">
                    {AccountingEngine.formatCurrency(Math.max(0, selectedDiscountTxn.Amount_Billed - (discountForm.amount || 0)))}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>New Outstanding Balance:</span>
                  <span className="font-mono">
                    {AccountingEngine.formatCurrency(
                      Math.max(0, Math.round(((selectedDiscountTxn.Amount_Billed - (discountForm.amount || 0)) - selectedDiscountTxn.Amount_Paid) * 100) / 100)
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {selectedDiscountTxn.Discount_Amount && selectedDiscountTxn.Discount_Amount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountForm({ amount: 0, reason: '' });
                      AccountingEngine.applyRentDiscount(selectedDiscountTxn.Rent_Txn_ID, 0, '', currentUser.Email);
                      onToast(`Cleared rent discount on invoice ${selectedDiscountTxn.Rent_Txn_ID}`, 'info');
                      setSelectedDiscountTxn(null);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    Remove Discount
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDiscountTxn(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                  >
                    Apply Discount
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedRentTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Rent Payment</h3>
                <p className="text-xs text-slate-500">For {tenantName(selectedRentTxn.Tenant_ID)} ({selectedRentTxn.Unit_ID})</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Period:</span>
                  <span className="font-bold text-slate-800">{selectedRentTxn.Period_Month}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Outstanding Balance:</span>
                  <span className="font-bold text-rose-600">{AccountingEngine.formatCurrency(selectedRentTxn.Balance)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Received ($)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={payForm.amountPaid}
                  onChange={(e) => setPayForm({ ...payForm, amountPaid: Number(e.target.value) })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option>Interac e-Transfer</option>
                    <option>Pre-Authorized Debit (PAD)</option>
                    <option>EFT Direct Deposit</option>
                    <option>Cheque</option>
                    <option>Wire Transfer</option>
                    <option>Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reference / Bank Transaction ID</label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                  placeholder="e.g. EFT-992019 or CHQ# 102"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              {payForm.amountPaid > selectedRentTxn.Balance && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900 space-y-0.5">
                  <p className="font-bold">Excess Payment Detected:</p>
                  <p>
                    Excess of <b className="text-amber-950">{AccountingEngine.formatCurrency(payForm.amountPaid - selectedRentTxn.Balance)}</b> will be recorded into Unearned Revenue / Excess Liability (GL 2300).
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Post Payment & Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Rent Invoice Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingRent}
        title="Delete Rent Invoice Record"
        itemName={deletingRent ? `${deletingRent.Rent_Txn_ID} (${deletingRent.Period_Month} - ${tenantName(deletingRent.Tenant_ID)})` : ''}
        itemType="rent invoice"
        warningMessage="Deleting this rent invoice will remove the billing record from the tenant's ledger."
        onConfirm={handleDeleteRentConfirm}
        onCancel={() => setDeletingRent(null)}
      />

      {/* Bank Payment Allocation Modal */}
      <BankPaymentAllocationModal
        isOpen={showAllocModal}
        onClose={() => setShowAllocModal(false)}
        onSuccess={() => {
          onToast('Bank payment allocated across tenant pendings!', 'success');
        }}
        onToast={onToast}
        currentUser={currentUser}
        preselectedTenantId={allocTenantId}
      />
    </div>
  );
};
