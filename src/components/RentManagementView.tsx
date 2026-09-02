import React, { useState } from 'react';
import {
  DollarSign, Zap, Plus, Search, Filter, CheckCircle2,
  AlertCircle, ArrowDownRight, RefreshCw, Calendar, Edit3, Trash2, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { RentTransaction, User } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RentManagementViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RentManagementView: React.FC<RentManagementViewProps> = ({ currentUser, onToast }) => {
  const rents = storage.getRentTransactions();
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
  const [selectedRentTxn, setSelectedRentTxn] = useState<RentTransaction | null>(null);
  const [payForm, setPayForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Interac e-Transfer',
    reference: ''
  });

  // Edit / Delete State
  const [editingRent, setEditingRent] = useState<RentTransaction | null>(null);
  const [deletingRent, setDeletingRent] = useState<RentTransaction | null>(null);
  const [editForm, setEditForm] = useState<{
    amountBilled: number;
    amountPaid: number;
    dueDate: string;
    status: RentTransaction['Status'];
  }>({
    amountBilled: 0,
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
    setPayForm({
      amountPaid: r.Balance > 0 ? r.Balance : r.Amount_Billed,
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

  const handleOpenEditRent = (r: RentTransaction) => {
    setEditingRent(r);
    setEditForm({
      amountBilled: r.Amount_Billed,
      amountPaid: r.Amount_Paid,
      dueDate: r.Due_Date,
      status: r.Status
    });
  };

  const handleSaveEditRent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRent) return;

    const billed = Number(editForm.amountBilled);
    const paid = Number(editForm.amountPaid);
    const balance = Math.max(0, billed - paid);

    const updated: RentTransaction = {
      ...editingRent,
      Amount_Billed: billed,
      Amount_Paid: paid,
      Balance: balance,
      Due_Date: editForm.dueDate,
      Status: editForm.status
    };

    storage.updateRentTransaction(updated, currentUser.Email);
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
    if (statusFilter !== 'ALL' && r.Status !== statusFilter) return false;
    if (propertyFilter !== 'ALL' && r.Property_ID !== propertyFilter) return false;
    return true;
  });

  const totalBilled = filteredRents.reduce((s, r) => s + r.Amount_Billed, 0);
  const totalPaid = filteredRents.reduce((s, r) => s + r.Amount_Paid, 0);
  const totalBalance = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Filtered Rent Billed</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{AccountingEngine.formatCurrency(totalBilled)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Collected</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{AccountingEngine.formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Outstanding Rent Receivable</p>
          <p className="text-xl font-extrabold text-rose-600 mt-1">{AccountingEngine.formatCurrency(totalBalance)}</p>
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
            <p className="text-xs text-slate-500 mt-0.5">Idempotent monthly billing runs, payment allocation & unearned excess handling</p>
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
                <th className="py-3 px-4 text-right">Billed</th>
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
                filteredRents.map(r => (
                  <tr key={r.Rent_Txn_ID} className="hover:bg-slate-50/70 transition-colors">
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
                    <td className="py-3.5 px-4 text-right font-medium">
                      {AccountingEngine.formatCurrency(r.Amount_Billed)}
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
                        <button
                          onClick={() => handleOpenPayModal(r)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditRent(r)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Edit Rent Transaction"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRent(r)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
                    step="0.01"
                    required
                    value={editForm.amountBilled}
                    onChange={(e) => setEditForm({ ...editForm, amountBilled: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount Paid ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.amountPaid}
                    onChange={(e) => setEditForm({ ...editForm, amountPaid: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-bold text-emerald-700"
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

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Calculated Balance:</span>
                  <span className="text-rose-600 font-bold">
                    {AccountingEngine.formatCurrency(Math.max(0, editForm.amountBilled - editForm.amountPaid))}
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
                  step="0.01"
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
    </div>
  );
};
