import React, { useState } from 'react';
import {
  DoorClosed, Plus, Calculator, CheckCircle2, AlertTriangle,
  ArrowRight, ShieldCheck, DollarSign, Edit3, Trash2, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { User, MoveOutRecord } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MoveOutViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MoveOutView: React.FC<MoveOutViewProps> = ({ currentUser, onToast }) => {
  const moveOuts = storage.getMoveOuts();
  const leases = storage.getLeases();
  const tenants = storage.getTenants();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const deposits = storage.getDepositTransactions();
  const rents = storage.getRentTransactions();

  const [showModal, setShowModal] = useState(false);
  const [editingMoveOut, setEditingMoveOut] = useState<MoveOutRecord | null>(null);
  const [deletingMoveOut, setDeletingMoveOut] = useState<MoveOutRecord | null>(null);

  const activeLeases = leases.filter(l => l.Status === 'Active');

  const [form, setForm] = useState({
    leaseId: activeLeases[0]?.Lease_ID || leases[0]?.Lease_ID || '',
    moveOutDate: new Date().toISOString().slice(0, 10),
    damageAmount: 0,
    depositRefund: 0,
    inspectionNotes: ''
  });

  const selectedLease = leases.find(l => l.Lease_ID === form.leaseId);
  const selectedTenant = tenants.find(t => t.Tenant_ID === selectedLease?.Tenant_ID);
  const selectedUnit = units.find(u => u.Unit_ID === selectedLease?.Unit_ID);

  // Compute pending rent and available deposit for selected lease
  const tenantRentDue = selectedLease
    ? rents.filter(r => r.Tenant_ID === selectedLease.Tenant_ID && r.Status !== 'Paid')
        .reduce((s, r) => s + (r.Amount_Billed - r.Amount_Paid), 0)
    : 0;

  const tenantSecurityDepositAvailable = selectedLease
    ? deposits.filter(d => d.Tenant_ID === selectedLease.Tenant_ID && d.Deposit_Type === 'Security Deposit' && d.Status === 'Received')
        .reduce((s, d) => s + d.Paid_Amount, 0)
    : 0;

  const tenantLMRAvailable = selectedLease
    ? deposits.filter(d => d.Tenant_ID === selectedLease.Tenant_ID && d.Deposit_Type === 'Last Month Rent' && d.Status === 'Received')
        .reduce((s, d) => s + d.Paid_Amount, 0)
    : 0;

  const tenantDepositAvailable = tenantSecurityDepositAvailable + tenantLMRAvailable;

  const estimatedRefund = Math.max(0, tenantDepositAvailable - (Number(form.damageAmount) || 0) - tenantRentDue);

  const handleOpenAdd = () => {
    setEditingMoveOut(null);
    setForm({
      leaseId: activeLeases[0]?.Lease_ID || leases[0]?.Lease_ID || '',
      moveOutDate: new Date().toISOString().slice(0, 10),
      damageAmount: 0,
      depositRefund: 0,
      inspectionNotes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m: MoveOutRecord) => {
    setEditingMoveOut(m);
    setForm({
      leaseId: m.Lease_ID,
      moveOutDate: m.MoveOut_Date,
      damageAmount: m.Damage_Amount || 0,
      depositRefund: m.Deposit_Refund || 0,
      inspectionNotes: m.Inspection_Notes || ''
    });
    setShowModal(true);
  };

  const handleProcessMoveOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaseId) return;

    try {
      if (editingMoveOut) {
        const updated: MoveOutRecord = {
          ...editingMoveOut,
          Lease_ID: form.leaseId,
          MoveOut_Date: form.moveOutDate,
          Damage_Amount: Number(form.damageAmount) || 0,
          Deposit_Refund: Number(form.depositRefund) || estimatedRefund,
          Notes: form.inspectionNotes
        };
        storage.updateMoveOut(updated, currentUser.Email);
        onToast(`Move-out settlement ${updated.MoveOut_ID} updated`, 'success');
      } else {
        const res = AccountingEngine.processMoveOut(
          form.leaseId,
          form.moveOutDate,
          form.damageAmount,
          form.inspectionNotes,
          currentUser.Email
        );
        onToast(`Move-out ${res.moveOutId} processed! Unit reset to Vacant, deposit refund of $${res.depositRefund} calculated.`, 'success');
      }
      setShowModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to process move-out', 'error');
    }
  };

  const handleDeleteMoveOutConfirm = () => {
    if (!deletingMoveOut) return;
    storage.deleteMoveOut(deletingMoveOut.MoveOut_ID, currentUser.Email);
    onToast(`Move-Out record ${deletingMoveOut.MoveOut_ID} deleted`, 'info');
    setDeletingMoveOut(null);
  };

  const tenantName = (id: string) => tenants.find(t => t.Tenant_ID === id)?.Full_Name || id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DoorClosed className="w-5 h-5 text-indigo-600" />
            Move-Out Settlement & Key Return Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automates damage holdbacks, arrears deduction, deposit refunds, and GL double-entry clearance</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Process Move-Out
        </button>
      </div>

      {/* Move Out History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">MoveOut ID</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Move-Out Date</th>
                <th className="py-3 px-4 text-right">Damage Holdback</th>
                <th className="py-3 px-4 text-right">Refund Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moveOuts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No move-out settlements recorded yet. Click "Process Move-Out" to log a vacancy settlement.
                  </td>
                </tr>
              ) : (
                moveOuts.map(m => (
                  <tr key={m.MoveOut_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{m.MoveOut_ID}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{tenantName(m.Tenant_ID)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{m.Unit_ID}</td>
                    <td className="py-3.5 px-4 text-slate-600">{m.MoveOut_Date}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                      {AccountingEngine.formatCurrency(m.Damage_Amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {AccountingEngine.formatCurrency(m.Deposit_Refund)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                        {m.Status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Move-Out"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMoveOut(m)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Move-Out Record"
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

      {/* Process / Edit Move Out Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingMoveOut ? `Edit Move-Out: ${editingMoveOut.MoveOut_ID}` : 'Process Tenant Move-Out Settlement'}
                </h3>
                <p className="text-xs text-slate-500">Reconcile deposits, damages, and clear unit occupancy</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessMoveOut} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Lease to Terminate</label>
                <select
                  value={form.leaseId}
                  onChange={(e) => setForm({ ...form, leaseId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  required
                >
                  {leases.map(l => (
                    <option key={l.Lease_ID} value={l.Lease_ID}>
                      {l.Lease_ID} — {tenantName(l.Tenant_ID)} ({l.Unit_ID}) [{l.Status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Actual Move-Out Date</label>
                <input
                  type="date"
                  required
                  value={form.moveOutDate}
                  onChange={(e) => setForm({ ...form, moveOutDate: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Damage / Repair Holdback ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.damageAmount}
                  onChange={(e) => setForm({ ...form, damageAmount: Number(e.target.value) })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Repairs, cleaning or key replacement charges deducted from deposit.</p>
              </div>

              {/* Live Statement Callout */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <p className="font-bold text-slate-900">Reconciliation Breakdown:</p>
                <div className="flex justify-between text-slate-600">
                  <span>Security / Key Deposit (GL 2200):</span>
                  <span className="font-semibold">{AccountingEngine.formatCurrency(tenantSecurityDepositAvailable)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Month Rent (LMR) Held (GL 2210):</span>
                  <span className="font-semibold">{AccountingEngine.formatCurrency(tenantLMRAvailable)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Damage Repairs:</span>
                  <span className="text-rose-600 font-semibold">-{AccountingEngine.formatCurrency(form.damageAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Unpaid Rent Arrears:</span>
                  <span className="text-rose-600 font-semibold">-{AccountingEngine.formatCurrency(tenantRentDue)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Net Deposit Refund to Tenant:</span>
                  <span className="text-emerald-700">{AccountingEngine.formatCurrency(estimatedRefund)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Inspection Notes</label>
                <textarea
                  rows={2}
                  value={form.inspectionNotes}
                  onChange={(e) => setForm({ ...form, inspectionNotes: e.target.value })}
                  placeholder="Key returned, unit condition inspected, repainting required..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {editingMoveOut ? 'Save Changes' : 'Finalize Move-Out & Release Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Move-Out Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingMoveOut}
        title="Delete Move-Out Settlement"
        itemName={deletingMoveOut ? `Settlement ${deletingMoveOut.MoveOut_ID} (${tenantName(deletingMoveOut.Tenant_ID)})` : ''}
        itemType="move-out record"
        warningMessage="Deleting this move-out record will remove its settlement calculations."
        onConfirm={handleDeleteMoveOutConfirm}
        onCancel={() => setDeletingMoveOut(null)}
      />
    </div>
  );
};
