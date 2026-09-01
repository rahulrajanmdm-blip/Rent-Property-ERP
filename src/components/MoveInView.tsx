import React, { useState } from 'react';
import {
  ArrowLeftRight, CheckCircle2, Clock, Plus, Search,
  Building2, Key, ShieldCheck, FileCheck, DollarSign,
  User, Check, X, Sparkles, FileText, AlertCircle, Edit3, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { MoveInRecord, Lease, Property, Unit, Tenant, User as ERPUser } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MoveInViewProps {
  currentUser: ERPUser;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MoveInView: React.FC<MoveInViewProps> = ({ currentUser, onToast }) => {
  const moveIns = storage.getMoveIns();
  const leases = storage.getLeases();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMoveIn, setEditingMoveIn] = useState<MoveInRecord | null>(null);
  const [deletingMoveIn, setDeletingMoveIn] = useState<MoveInRecord | null>(null);

  // Form State
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(leases[0]?.Lease_ID || '');
  const [moveInDate, setMoveInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [keysGiven, setKeysGiven] = useState<number>(2);
  const [fobGiven, setFobGiven] = useState<number>(1);
  const [hydroMeterReading, setHydroMeterReading] = useState<string>('14820 kWh');
  const [gasMeterReading, setGasMeterReading] = useState<string>('310 m³');
  const [conditionNotes, setConditionNotes] = useState<string>('Freshly painted, hardwood floors in pristine condition, all appliances tested and working.');
  const [depositReceived, setDepositReceived] = useState<boolean>(true);
  const [firstMonthRentReceived, setFirstMonthRentReceived] = useState<boolean>(true);
  const [tenantSigned, setTenantSigned] = useState<boolean>(true);

  const filteredMoveIns = moveIns.filter(m => {
    const prop = properties.find(p => p.Property_ID === m.Property_ID);
    const tenant = tenants.find(t => t.Tenant_ID === m.Tenant_ID);
    const term = search.toLowerCase();
    return (
      m.MoveIn_ID.toLowerCase().includes(term) ||
      (tenant && tenant.Full_Name.toLowerCase().includes(term)) ||
      (prop && prop.Property_Name.toLowerCase().includes(term)) ||
      (m.Notes && m.Notes.toLowerCase().includes(term))
    );
  });

  const handleOpenAddModal = () => {
    setEditingMoveIn(null);
    if (leases.length > 0) {
      setSelectedLeaseId(leases[0].Lease_ID);
    }
    setMoveInDate(new Date().toISOString().split('T')[0]);
    setKeysGiven(2);
    setFobGiven(1);
    setHydroMeterReading('14820 kWh');
    setGasMeterReading('310 m³');
    setConditionNotes('Freshly painted, hardwood floors in pristine condition, all appliances tested and working.');
    setDepositReceived(true);
    setFirstMonthRentReceived(true);
    setTenantSigned(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: MoveInRecord) => {
    setEditingMoveIn(m);
    setSelectedLeaseId(m.Lease_ID);
    setMoveInDate(m.Move_In_Date);
    setKeysGiven(m.Keys_Given || 2);
    setConditionNotes(m.Notes || '');
    setShowAddModal(true);
  };

  const handleSaveMoveIn = (e: React.FormEvent) => {
    e.preventDefault();
    const lease = leases.find(l => l.Lease_ID === selectedLeaseId);
    if (!lease) {
      onToast('Please select a valid lease agreement', 'error');
      return;
    }

    if (editingMoveIn) {
      const updated: MoveInRecord = {
        ...editingMoveIn,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Move_In_Date: moveInDate,
        Keys_Given: keysGiven,
        Inspection_Passed: true,
        Notes: conditionNotes.includes('Keys:')
          ? conditionNotes
          : `Keys: ${keysGiven}, Fobs: ${fobGiven} · Hydro: ${hydroMeterReading} · Gas: ${gasMeterReading} · CIR: ${conditionNotes}`
      };
      storage.updateMoveIn(updated, currentUser.Email);
      onToast(`Move-In report ${updated.MoveIn_ID} updated`, 'success');
    } else {
      const nextId = 'MIN-' + String(moveIns.length + 1).padStart(3, '0');
      const newRecord: MoveInRecord = {
        MoveIn_ID: nextId,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Move_In_Date: moveInDate,
        Keys_Given: keysGiven,
        Inspection_Passed: true,
        Notes: `Keys: ${keysGiven}, Fobs: ${fobGiven} · Hydro: ${hydroMeterReading} · Gas: ${gasMeterReading} · CIR: ${conditionNotes} · First Month Rent: ${firstMonthRentReceived ? 'Paid' : 'Pending'} · Deposit: ${depositReceived ? 'Paid' : 'Pending'} · Tenant Signed: ${tenantSigned ? 'Yes' : 'No'}`,
        Created_By: currentUser.Email,
        Created_At: new Date().toISOString()
      };

      storage.addMoveIn(newRecord, currentUser.Email);
      onToast(`✅ Move-In inspection ${nextId} completed! Suite handed over.`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteMoveInConfirm = () => {
    if (!deletingMoveIn) return;
    storage.deleteMoveIn(deletingMoveIn.MoveIn_ID, currentUser.Email);
    onToast(`Move-In record ${deletingMoveIn.MoveIn_ID} deleted`, 'info');
    setDeletingMoveIn(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Move-In & Key Handover Onboarding</h2>
              <p className="text-xs text-slate-500">Perform Condition Inspection Reports (CIR), record initial meter readings, verify deposit receipts, and issue access fobs</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Perform Move-In Inspection
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Move-Ins</p>
          <p className="text-xl font-black text-slate-900 mt-1">{moveIns.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Inspected & Signed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Active Leases</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{leases.filter(l => l.Status === 'Active').length}</p>
          <span className="text-[10px] text-slate-500">Currently Occupied Tenancies</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Statutory CIR Compliance</p>
          <p className="text-xl font-black text-emerald-700 mt-1">Provincial Standard</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Ontario / BC / Alberta Certified</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search move-in inspection logs by tenant, property, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Move-In Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMoveIns.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No move-in inspection records found. Click "Perform Move-In Inspection" to log onboarding.
          </div>
        ) : (
          filteredMoveIns.map(m => {
            const tenant = tenants.find(t => t.Tenant_ID === m.Tenant_ID);
            const property = properties.find(p => p.Property_ID === m.Property_ID);
            const unit = units.find(u => u.Unit_ID === m.Unit_ID);
            const lease = leases.find(l => l.Lease_ID === m.Lease_ID);

            return (
              <div
                key={m.MoveIn_ID}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{tenant?.Full_Name || m.Tenant_ID}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Inspected
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{m.MoveIn_ID} · Lease {m.Lease_ID}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Move-In"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMoveIn(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Move-In Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Property:
                      </span>
                      <span className="font-semibold text-slate-800">{property?.Property_Name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Unit:</span>
                      <span className="font-bold text-slate-900">{unit?.Unit_Number_Name || unit?.Unit_Number || m.Unit_ID}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Move-In Date:</span>
                      <span className="font-bold text-emerald-700">{m.Move_In_Date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-500" /> Keys Issued:
                      </span>
                      <span className="font-bold text-slate-800">{m.Keys_Given || 2} sets</span>
                    </div>
                  </div>

                  {m.Notes && (
                    <div className="text-[11px] text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                      <p className="font-bold text-emerald-800 text-[10px] uppercase mb-0.5">Condition Report & Verification</p>
                      {m.Notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Perform / Edit Move-In Inspection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMoveIn ? `Edit Move-In Inspection: ${editingMoveIn.MoveIn_ID}` : 'Conduct Move-In CIR Inspection'}
                  </h3>
                  <p className="text-xs text-slate-500">Statutory provincial condition report & initial meter logging</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMoveIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Active Lease Agreement *</label>
                <select
                  value={selectedLeaseId}
                  onChange={(e) => setSelectedLeaseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                >
                  {leases.map(l => {
                    const t = tenants.find(x => x.Tenant_ID === l.Tenant_ID);
                    const p = properties.find(x => x.Property_ID === l.Property_ID);
                    const u = units.find(x => x.Unit_ID === l.Unit_ID);
                    return (
                      <option key={l.Lease_ID} value={l.Lease_ID}>
                        {l.Lease_ID} — {t?.Full_Name || l.Tenant_ID} ({p?.Property_Name} / {u?.Unit_Number_Name || u?.Unit_Number || l.Unit_ID})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Move-In Date *</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Key Sets Issued</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={keysGiven}
                    onChange={(e) => setKeysGiven(parseInt(e.target.value) || 2)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Access Fobs</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={fobGiven}
                    onChange={(e) => setFobGiven(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* Utility Meter Readings */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 text-xs">Initial Utility Meter Readings (Day 1)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Electricity / Hydro Meter</label>
                    <input
                      type="text"
                      value={hydroMeterReading}
                      onChange={(e) => setHydroMeterReading(e.target.value)}
                      placeholder="e.g. 14820 kWh"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Natural Gas Meter</label>
                    <input
                      type="text"
                      value={gasMeterReading}
                      onChange={(e) => setGasMeterReading(e.target.value)}
                      placeholder="e.g. 310 m³"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox Compliance Items */}
              <div className="space-y-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firstMonthRentReceived}
                    onChange={(e) => setFirstMonthRentReceived(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">First Month Rent Received & Reconciled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositReceived}
                    onChange={(e) => setDepositReceived(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Security Deposit / LMR Held in Trust Account</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tenantSigned}
                    onChange={(e) => setTenantSigned(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Tenant & Landlord Signed Condition Inspection Report</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Inspection Notes</label>
                <textarea
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingMoveIn ? 'Save Changes' : 'Complete Move-In Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Move-In Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingMoveIn}
        title="Delete Move-In Inspection"
        itemName={deletingMoveIn ? `Inspection ${deletingMoveIn.MoveIn_ID}` : ''}
        itemType="move-in inspection"
        warningMessage="Deleting this move-in inspection record will remove the initial condition log."
        onConfirm={handleDeleteMoveInConfirm}
        onCancel={() => setDeletingMoveIn(null)}
      />
    </div>
  );
};
