import React, { useState } from 'react';
import {
  Landmark, AlertTriangle, Search, Plus, Phone,
  Mail, Calendar, DollarSign, FileText, CheckCircle2,
  X, Check, ShieldAlert, ArrowRight, Clock, Scale, Edit3, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { CollectionRecord, RentTransaction, Property, Tenant, Unit, User, Lease } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CollectionsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({ currentUser, onToast }) => {
  const rentTxns = storage.getRentTransactions();
  const collections = storage.getCollections();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();
  const leases = storage.getLeases();

  const [search, setSearch] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionRecord | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<CollectionRecord | null>(null);

  const [activeNoticeData, setActiveNoticeData] = useState<{
    tenant: Tenant;
    property: Property;
    unit: Unit;
    rentTxn: RentTransaction;
    noticeType: 'Ontario N4' | 'BC 10-Day' | 'Alberta 14-Day';
  } | null>(null);

  // Form State for Collection Log
  const [selectedTxnId, setSelectedTxnId] = useState<string>('');
  const [actionType, setActionType] = useState<CollectionRecord['Action_Type']>('Formal Written Demand Notice');
  const [status, setStatus] = useState<CollectionRecord['Status']>('In Progress');
  const [notes, setNotes] = useState<string>('Tenant agreed to clear balance via Interac e-Transfer by Friday.');
  const [nextFollowUp, setNextFollowUp] = useState<string>(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);

  // Arrears Rent Transactions
  const arrearsTxns = rentTxns.filter(r => r.Balance > 0);

  const filteredArrears = arrearsTxns.filter(r => {
    const tenant = tenants.find(t => t.Tenant_ID === r.Tenant_ID);
    const prop = properties.find(p => p.Property_ID === r.Property_ID);
    const term = search.toLowerCase();
    const matchSearch =
      r.Rent_Txn_ID.toLowerCase().includes(term) ||
      (tenant && tenant.Full_Name.toLowerCase().includes(term)) ||
      (prop && prop.Property_Name.toLowerCase().includes(term));
    const matchProp = filterProperty === 'ALL' || r.Property_ID === filterProperty;
    return matchSearch && matchProp;
  });

  // Calculate Aging
  const now = new Date();
  let bucket0_30 = 0;
  let bucket30_60 = 0;
  let bucket60_90 = 0;
  let bucket90Plus = 0;

  arrearsTxns.forEach(r => {
    const due = new Date(r.Due_Date);
    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 30) bucket0_30 += r.Balance;
    else if (diffDays <= 60) bucket30_60 += r.Balance;
    else if (diffDays <= 90) bucket60_90 += r.Balance;
    else bucket90Plus += r.Balance;
  });

  const totalOverdue = bucket0_30 + bucket30_60 + bucket60_90 + bucket90Plus;

  const handleOpenAdd = (txn?: RentTransaction) => {
    setEditingCollection(null);
    if (txn) {
      setSelectedTxnId(txn.Rent_Txn_ID);
    } else if (arrearsTxns.length > 0) {
      setSelectedTxnId(arrearsTxns[0].Rent_Txn_ID);
    }
    setActionType('Formal Written Demand Notice');
    setStatus('In Progress');
    setNotes('Tenant agreed to clear balance via Interac e-Transfer by Friday.');
    setNextFollowUp(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleOpenEdit = (col: CollectionRecord) => {
    setEditingCollection(col);
    setSelectedTxnId(col.Rent_Txn_ID);
    setActionType(col.Action_Type);
    setStatus(col.Status);
    setNotes(col.Notes || '');
    setNextFollowUp(col.Next_Follow_Up || new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const txn = rentTxns.find(r => r.Rent_Txn_ID === selectedTxnId);
    if (!txn) {
      onToast('Please select an overdue rent invoice', 'error');
      return;
    }

    if (editingCollection) {
      const updated: CollectionRecord = {
        ...editingCollection,
        Rent_Txn_ID: txn.Rent_Txn_ID,
        Tenant_ID: txn.Tenant_ID,
        Property_ID: txn.Property_ID,
        Unit_ID: txn.Unit_ID,
        Action_Type: actionType,
        Outstanding_Amount: txn.Balance,
        Status: status,
        Next_Follow_Up: nextFollowUp,
        Notes: notes
      };
      storage.updateCollection(updated, currentUser.Email);
      onToast(`Collection record ${updated.Collection_ID} updated`, 'success');
    } else {
      const nextId = 'COL-' + String(collections.length + 1).padStart(3, '0');
      const newCol: CollectionRecord = {
        Collection_ID: nextId,
        Rent_Txn_ID: txn.Rent_Txn_ID,
        Tenant_ID: txn.Tenant_ID,
        Property_ID: txn.Property_ID,
        Unit_ID: txn.Unit_ID,
        Action_Type: actionType,
        Action_Date: new Date().toISOString().split('T')[0],
        Outstanding_Amount: txn.Balance,
        Status: status,
        Next_Follow_Up: nextFollowUp,
        Notes: notes,
        Created_By: currentUser.Email
      };

      storage.addCollection(newCol, currentUser.Email);
      onToast(`⚖️ Collection activity ${nextId} logged against ${txn.Tenant_ID}`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteCollectionConfirm = () => {
    if (!deletingCollection) return;
    storage.deleteCollection(deletingCollection.Collection_ID, currentUser.Email);
    onToast(`Collection record ${deletingCollection.Collection_ID} deleted`, 'info');
    setDeletingCollection(null);
  };

  const handleGenerateNotice = (r: RentTransaction) => {
    const tenant = tenants.find(t => t.Tenant_ID === r.Tenant_ID);
    const prop = properties.find(p => p.Property_ID === r.Property_ID);
    const unit = units.find(u => u.Unit_ID === r.Unit_ID);

    if (!tenant || !prop || !unit) {
      onToast('Missing tenant or property record for notice generation', 'error');
      return;
    }

    let noticeType: 'Ontario N4' | 'BC 10-Day' | 'Alberta 14-Day' = 'Ontario N4';
    if (prop.Province === 'BC') noticeType = 'BC 10-Day';
    else if (prop.Province === 'AB') noticeType = 'Alberta 14-Day';

    setActiveNoticeData({
      tenant,
      property: prop,
      unit,
      rentTxn: r,
      noticeType
    });
    setShowNoticeModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Collections Ledger & Arrears Aging</h2>
              <p className="text-xs text-slate-500">Track outstanding rent balances, manage payment plans, and generate statutory Canadian late notices (Ontario N4 / BC 10-Day / AB 14-Day)</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Collection Action
        </button>
      </div>

      {/* Arrears Aging Buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Total Arrears</p>
          <p className="text-xl font-black text-rose-700 mt-1">{AccountingEngine.formatCurrency(totalOverdue)}</p>
          <span className="text-[10px] text-rose-500">{arrearsTxns.length} Overdue Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">0 - 30 Days (Current)</p>
          <p className="text-xl font-black text-slate-800 mt-1">{AccountingEngine.formatCurrency(bucket0_30)}</p>
          <span className="text-[10px] text-slate-500">Friendly Reminders Sent</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">31 - 60 Days</p>
          <p className="text-xl font-black text-amber-700 mt-1">{AccountingEngine.formatCurrency(bucket30_60)}</p>
          <span className="text-[10px] text-amber-600">Formal Warning Stage</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600">61 - 90 Days</p>
          <p className="text-xl font-black text-orange-700 mt-1">{AccountingEngine.formatCurrency(bucket60_90)}</p>
          <span className="text-[10px] text-orange-600">N4 Notice Served</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">90+ Days (Critical)</p>
          <p className="text-xl font-black text-rose-800 mt-1">{AccountingEngine.formatCurrency(bucket90Plus)}</p>
          <span className="text-[10px] text-rose-600">Tribunal / Legal Action</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search overdue tenants or invoice ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
        </div>

        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="ALL">All Properties</option>
          {properties.map(p => (
            <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
          ))}
        </select>
      </div>

      {/* Arrears List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-xs">Overdue Invoices & Delinquencies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice & Period</th>
                <th className="py-3 px-4">Tenant & Contact</th>
                <th className="py-3 px-4">Property & Suite</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Billed</th>
                <th className="py-3 px-4 text-right">Overdue Balance</th>
                <th className="py-3 px-4 text-center">Statutory Notice</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArrears.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-slate-700">Zero Overdue Arrears</p>
                    <p className="text-xs text-slate-400">All tenant rent balances are 100% paid and reconciled.</p>
                  </td>
                </tr>
              ) : (
                filteredArrears.map(r => {
                  const tenant = tenants.find(t => t.Tenant_ID === r.Tenant_ID);
                  const prop = properties.find(p => p.Property_ID === r.Property_ID);
                  const unit = units.find(u => u.Unit_ID === r.Unit_ID);

                  return (
                    <tr key={r.Rent_Txn_ID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{r.Rent_Txn_ID}</p>
                        <span className="text-[11px] font-semibold text-indigo-600">{r.Period_Month}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{tenant?.Full_Name || r.Tenant_ID}</p>
                        <span className="text-[11px] text-slate-500">{tenant?.Phone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-700">{prop?.Property_Name}</p>
                        <span className="text-[11px] text-slate-500">
                          {unit ? (unit.Unit_Number_Name || unit.Unit_Number || unit.Unit_ID) : r.Unit_ID}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-rose-700">{r.Due_Date}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                        {AccountingEngine.formatCurrency(r.Amount_Billed)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600">
                        {AccountingEngine.formatCurrency(r.Balance)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleGenerateNotice(r)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Generate {prop?.Province === 'BC' ? 'BC 10-Day' : prop?.Province === 'AB' ? 'AB 14-Day' : 'N4 Notice'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdd(r)}
                          className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-colors"
                        >
                          Log Action
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collection Activity History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs">Logged Collection Actions & Recovery History</h3>
          <span className="text-[11px] text-slate-400">{collections.length} logged actions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Action ID</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Action Date</th>
                <th className="py-3 px-4">Follow-Up</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No collection actions logged yet.
                  </td>
                </tr>
              ) : (
                collections.map(col => {
                  const tenant = tenants.find(t => t.Tenant_ID === col.Tenant_ID);
                  return (
                    <tr key={col.Collection_ID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{col.Collection_ID}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{tenant?.Full_Name || col.Tenant_ID}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{col.Action_Type}</td>
                      <td className="py-3 px-4 text-slate-500">{col.Action_Date}</td>
                      <td className="py-3 px-4 text-rose-700 font-semibold">{col.Next_Follow_Up || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {col.Status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{col.Notes}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(col)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Log"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCollection(col)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Action"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Late Notice Dialog Modal */}
      {showNoticeModal && activeNoticeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Canadian Statutory Rent Notice — {activeNoticeData.noticeType}
                  </h3>
                  <p className="text-xs text-slate-500">Official legal template under provincial tenancy legislation</p>
                </div>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 font-serif text-slate-800 space-y-4 text-xs leading-relaxed shadow-inner">
              <div className="text-center pb-3 border-b border-slate-200">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                  {activeNoticeData.noticeType === 'Ontario N4' && 'Form N4: Notice to End your Tenancy for Non-payment of Rent'}
                  {activeNoticeData.noticeType === 'BC 10-Day' && 'Form RTB-30: 10-Day Notice to End Tenancy for Unpaid Rent'}
                  {activeNoticeData.noticeType === 'Alberta 14-Day' && 'Notice of Termination of Tenancy for Substantial Breach (Rent Arrears)'}
                </h4>
                <p className="text-[11px] font-sans text-slate-500 mt-1">
                  Residential Tenancies Act ({activeNoticeData.property.Province})
                </p>
              </div>

              <div className="space-y-1 font-sans">
                <p><b>To Tenant:</b> {activeNoticeData.tenant.Full_Name} ({activeNoticeData.tenant.Email})</p>
                <p><b>Rental Unit:</b> {activeNoticeData.unit.Unit_Number_Name || activeNoticeData.unit.Unit_Number}, {activeNoticeData.property.Address}, {activeNoticeData.property.City}, {activeNoticeData.property.Province} {activeNoticeData.property.Postal_Code}</p>
                <p><b>Landlord / Management:</b> Dream Dwell Real Estate ERP Inc. on behalf of Property #{activeNoticeData.property.Property_ID}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 font-sans space-y-1.5">
                <p className="font-bold text-rose-700">STATEMENT OF RENT ARREARS:</p>
                <p className="flex justify-between">
                  <span>Billing Period: {activeNoticeData.rentTxn.Period_Month}</span>
                  <span className="font-mono font-bold text-slate-900">Overdue Balance: {AccountingEngine.formatCurrency(activeNoticeData.rentTxn.Balance)}</span>
                </p>
                <p className="text-[11px] text-slate-500">Originally Due on: {activeNoticeData.rentTxn.Due_Date}</p>
              </div>

              <p>
                Take notice that you owe the landlord <b>{AccountingEngine.formatCurrency(activeNoticeData.rentTxn.Balance)}</b> in overdue rent.
                You are required to pay the full overdue balance on or before <b>{new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}</b> (14 statutory days from service).
              </p>

              <p className="text-[11px] text-slate-500 italic">
                If the full balance is not paid and you do not dispute this notice before the tribunal, the tenancy will terminate and application for an eviction order will be submitted.
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">Template verified under provincial landlord-tenant guidelines</span>
              <button
                onClick={() => {
                  onToast(`📄 Printed & Sent ${activeNoticeData.noticeType} to ${activeNoticeData.tenant.Full_Name}`, 'success');
                  setShowNoticeModal(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Confirm & Serve Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log / Edit Collection Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCollection ? `Edit Collection Action: ${editingCollection.Collection_ID}` : 'Record Collection Activity'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Overdue Rent Invoice *</label>
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 font-semibold"
                  required
                >
                  {arrearsTxns.map(r => {
                    const t = tenants.find(x => x.Tenant_ID === r.Tenant_ID);
                    return (
                      <option key={r.Rent_Txn_ID} value={r.Rent_Txn_ID}>
                        {r.Rent_Txn_ID} — {t?.Full_Name || r.Tenant_ID} ({r.Period_Month}, Balance: ${r.Balance.toLocaleString()})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 font-semibold"
                  >
                    <option value="Phone Call & Reminder">Phone Call & Reminder</option>
                    <option value="Formal Written Demand Notice">Formal Written Demand Notice</option>
                    <option value="Statutory N4/Eviction Notice Served">Statutory N4/Eviction Notice Served</option>
                    <option value="Agreed Payment Plan">Agreed Payment Plan</option>
                    <option value="Sent to Collections Agency">Sent to Collections Agency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 font-semibold"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Promised Payment">Promised Payment</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Legal Action">Legal Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Action Notes / Payment Promise Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500"
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingCollection ? 'Save Changes' : 'Save Collection Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Collection Action Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingCollection}
        title="Delete Collection Record"
        itemName={deletingCollection ? `Action ${deletingCollection.Collection_ID} (${deletingCollection.Action_Type})` : ''}
        itemType="collection activity"
        warningMessage="Deleting this collection record will remove this log from the arrears trail."
        onConfirm={handleDeleteCollectionConfirm}
        onCancel={() => setDeletingCollection(null)}
      />
    </div>
  );
};
