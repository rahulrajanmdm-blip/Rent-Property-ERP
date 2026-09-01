import React, { useState } from 'react';
import {
  PiggyBank, Plus, Search, Landmark, ShieldCheck,
  AlertCircle, Building2, CheckCircle2, DollarSign,
  ArrowRight, FileText, Scale, X, Check, Clock, Edit3, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { DepositTransaction, Lease, Property, Unit, Tenant, User, JournalHeader, JournalLine } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface DepositsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({ currentUser, onToast }) => {
  const depositTxns = storage.getDepositTransactions();
  const leases = storage.getLeases();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();

  const [search, setSearch] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositTransaction | null>(null);
  const [deletingDeposit, setDeletingDeposit] = useState<DepositTransaction | null>(null);

  // Form State
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(leases[0]?.Lease_ID || '');
  const [paidAmount, setPaidAmount] = useState<number>(2200);
  const [dueAmount, setDueAmount] = useState<number>(2200);
  const [txnDate, setTxnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('Interac e-Transfer #DEP-8921');
  const [status, setStatus] = useState<DepositTransaction['Status']>('Received');
  const [notes, setNotes] = useState<string>('Security Deposit / Last Month Rent received into Trust Account.');

  const filteredTxns = depositTxns.filter(txn => {
    const tenant = tenants.find(t => t.Tenant_ID === txn.Tenant_ID);
    const prop = properties.find(p => p.Property_ID === txn.Property_ID);
    const term = search.toLowerCase();
    const matchSearch =
      txn.Deposit_Txn_ID.toLowerCase().includes(term) ||
      (tenant && tenant.Full_Name.toLowerCase().includes(term)) ||
      (prop && prop.Property_Name.toLowerCase().includes(term)) ||
      (txn.Reference && txn.Reference.toLowerCase().includes(term));
    const matchProp = filterProperty === 'ALL' || txn.Property_ID === filterProperty;
    const matchStatus = filterStatus === 'ALL' || txn.Status === filterStatus;
    return matchSearch && matchProp && matchStatus;
  });

  // Analytics
  const totalHeldInTrust = depositTxns.reduce((sum, t) => sum + (t.Paid_Amount || 0) - (t.Refund_Amount || 0), 0);
  const totalReceivable = depositTxns.reduce((sum, t) => sum + (t.Balance || 0), 0);
  const totalRefunded = depositTxns.reduce((sum, t) => sum + (t.Refund_Amount || 0), 0);

  const handleOpenAdd = () => {
    setEditingDeposit(null);
    if (leases.length > 0) {
      const l = leases[0];
      setSelectedLeaseId(l.Lease_ID);
      const req = l.Deposit_Required || l.Monthly_Rent || 2000;
      setDueAmount(req);
      setPaidAmount(req);
    }
    setTxnDate(new Date().toISOString().split('T')[0]);
    setReference('Interac e-Transfer #DEP-8921');
    setStatus('Received');
    setShowAddModal(true);
  };

  const handleOpenEdit = (d: DepositTransaction) => {
    setEditingDeposit(d);
    setSelectedLeaseId(d.Lease_ID);
    setDueAmount(d.Due_Amount || 2200);
    setPaidAmount(d.Paid_Amount || 0);
    setTxnDate(d.Txn_Date);
    setReference(d.Reference || '');
    setStatus(d.Status);
    setShowAddModal(true);
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const lease = leases.find(l => l.Lease_ID === selectedLeaseId);
    if (!lease) {
      onToast('Please select a valid lease', 'error');
      return;
    }

    if (editingDeposit) {
      const updated: DepositTransaction = {
        ...editingDeposit,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Due_Amount: dueAmount,
        Paid_Amount: paidAmount,
        Balance: Math.max(0, dueAmount - paidAmount),
        Txn_Date: txnDate,
        Status: status,
        Reference: reference
      };
      storage.updateDepositTransaction(updated, currentUser.Email);
      onToast(`Deposit record ${updated.Deposit_Txn_ID} updated`, 'success');
    } else {
      const nextId = 'DEP-' + String(depositTxns.length + 1).padStart(3, '0');
      const newTxn: DepositTransaction = {
        Deposit_Txn_ID: nextId,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Txn_Type: 'Payment',
        Due_Amount: dueAmount,
        Paid_Amount: paidAmount,
        Refund_Amount: 0,
        Balance: Math.max(0, dueAmount - paidAmount),
        Txn_Date: txnDate,
        Status: paidAmount >= dueAmount ? 'Received' : 'Partial',
        Reference: reference,
        Created_By: currentUser.Email
      };

      storage.addDepositTransaction(newTxn, currentUser.Email);

      // Double Entry Journal: DR Trust Account (1020), CR Tenant Deposits Held Liability (2200)
      const jId = 'JRN-DEP-' + Date.now().toString(36).toUpperCase();
      const jLines: JournalLine[] = [
        {
          Line_ID: `${jId}-1`,
          Journal_ID: jId,
          Account_Code: '1020',
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Tenant_ID: lease.Tenant_ID,
          Debit_Amount: paidAmount,
          Credit_Amount: 0,
          Memo: `Deposit Received for Lease ${lease.Lease_ID} - ${reference}`
        },
        {
          Line_ID: `${jId}-2`,
          Journal_ID: jId,
          Account_Code: '2200',
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Tenant_ID: lease.Tenant_ID,
          Debit_Amount: 0,
          Credit_Amount: paidAmount,
          Memo: `Tenant Deposit Held Liability (Security & LMR)`
        }
      ];

      const header: JournalHeader = {
        Journal_ID: jId,
        Date: txnDate,
        Description: `Deposit Receipt — ${lease.Lease_ID} (${reference})`,
        Reference_Type: 'DEPOSIT_RECEIPT',
        Reference_ID: nextId,
        Created_By: currentUser.Email,
        Status: 'POSTED',
        Period_ID: 'PER-2025',
        Created_At: new Date().toISOString()
      };

      storage.postJournal(header, jLines, currentUser.Email);
      onToast(`🏦 Deposit ${nextId} of $${paidAmount.toLocaleString()} recorded & posted to Trust Account 1020!`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteDepositConfirm = () => {
    if (!deletingDeposit) return;
    storage.deleteDepositTransaction(deletingDeposit.Deposit_Txn_ID, currentUser.Email);
    onToast(`Deposit entry ${deletingDeposit.Deposit_Txn_ID} deleted`, 'info');
    setDeletingDeposit(null);
  };

  const getStatusBadge = (status: DepositTransaction['Status']) => {
    switch (status) {
      case 'Received':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Held in Trust</span>;
      case 'Partial':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Partial Deposit</span>;
      case 'Receivable':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Pending Receipt</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <PiggyBank className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Deposits & Security Trust Ledger</h2>
              <p className="text-xs text-slate-500">Track and safeguard tenant security and Last Month Rent (LMR) deposits held in escrow/trust accounts</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Record Deposit Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Held in Trust</p>
          <p className="text-xl font-black text-slate-900 mt-1">{AccountingEngine.formatCurrency(totalHeldInTrust)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Account 1020 · Escrow Secured</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Pending Receivables</p>
          <p className="text-xl font-black text-rose-600 mt-1">{AccountingEngine.formatCurrency(totalReceivable)}</p>
          <span className="text-[10px] text-slate-500">Awaiting tenant transfers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Settled & Refunded</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{AccountingEngine.formatCurrency(totalRefunded)}</p>
          <span className="text-[10px] text-slate-500">Returned upon move-out</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deposit receipts by tenant, property, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Properties</option>
          {properties.map(p => (
            <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Received">Held in Trust</option>
          <option value="Partial">Partial Deposit</option>
          <option value="Receivable">Pending Receipt</option>
        </select>
      </div>

      {/* Deposit Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Txn ID & Date</th>
                <th className="py-3 px-4">Tenant & Suite</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4 text-right">Required</th>
                <th className="py-3 px-4 text-right">Paid into Trust</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No deposit transactions found matching filters. Click "Record Deposit Payment" to add.
                  </td>
                </tr>
              ) : (
                filteredTxns.map(txn => {
                  const tenant = tenants.find(t => t.Tenant_ID === txn.Tenant_ID);
                  const property = properties.find(p => p.Property_ID === txn.Property_ID);
                  const unit = units.find(u => u.Unit_ID === txn.Unit_ID);

                  return (
                    <tr key={txn.Deposit_Txn_ID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{txn.Deposit_Txn_ID}</p>
                        <span className="text-[11px] text-slate-400">{txn.Txn_Date}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{tenant?.Full_Name || txn.Tenant_ID}</p>
                        <span className="text-[11px] text-slate-500">
                          {unit ? (unit.Unit_Number_Name || unit.Unit_Number || unit.Unit_ID) : txn.Unit_ID}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{property?.Property_Name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                        {AccountingEngine.formatCurrency(txn.Due_Amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {AccountingEngine.formatCurrency(txn.Paid_Amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                        {AccountingEngine.formatCurrency(txn.Balance)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(txn.Status)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {txn.Reference || 'Interac Trust Transfer'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(txn)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Deposit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingDeposit(txn)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Deposit Record"
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

      {/* Record / Edit Deposit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDeposit ? `Edit Deposit Entry: ${editingDeposit.Deposit_Txn_ID}` : 'Record Deposit into Trust'}
                  </h3>
                  <p className="text-xs text-slate-500">Posts DR 1020 (Trust Bank) / CR 2200 (Deposit Liability)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Lease *</label>
                <select
                  value={selectedLeaseId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setSelectedLeaseId(lId);
                    const lObj = leases.find(x => x.Lease_ID === lId);
                    if (lObj && !editingDeposit) {
                      const req = lObj.Deposit_Required || lObj.Monthly_Rent || 2000;
                      setDueAmount(req);
                      setPaidAmount(req);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                >
                  {leases.map(l => {
                    const t = tenants.find(x => x.Tenant_ID === l.Tenant_ID);
                    const p = properties.find(x => x.Property_ID === l.Property_ID);
                    return (
                      <option key={l.Lease_ID} value={l.Lease_ID}>
                        {l.Lease_ID} — {t?.Full_Name || l.Tenant_ID} ({p?.Property_Name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Amount (CAD) *</label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deposit Paid (CAD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DepositTransaction['Status'])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Received">Held in Trust</option>
                    <option value="Partial">Partial</option>
                    <option value="Receivable">Receivable</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Banking / Transfer Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Interac e-Transfer #DEP-9082 / Bank Wire"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingDeposit ? 'Save Changes' : 'Post Deposit to Trust'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Deposit Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingDeposit}
        title="Delete Deposit Transaction"
        itemName={deletingDeposit ? `Deposit ${deletingDeposit.Deposit_Txn_ID} (${AccountingEngine.formatCurrency(deletingDeposit.Paid_Amount)})` : ''}
        itemType="deposit entry"
        warningMessage="Deleting this deposit entry will remove it from the trust liability ledger."
        onConfirm={handleDeleteDepositConfirm}
        onCancel={() => setDeletingDeposit(null)}
      />
    </div>
  );
};
