import React, { useState } from 'react';
import {
  FileSignature, Plus, FolderPlus, ExternalLink, Calendar,
  DollarSign, CheckCircle2, ShieldAlert, Building, DoorOpen,
  Edit3, Trash2, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { Lease, User, RegionalProvince } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface LeasesViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeasesView: React.FC<LeasesViewProps> = ({ currentUser, onToast }) => {
  const leases = storage.getLeases();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();

  const [showModal, setShowModal] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [deletingLease, setDeletingLease] = useState<Lease | null>(null);

  const [form, setForm] = useState({
    Tenant_ID: tenants[0]?.Tenant_ID || '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_ID: units[0]?.Unit_ID || '',
    Lease_Start: new Date().toISOString().slice(0, 10),
    Lease_End: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    Monthly_Rent: 2250,
    Deposit_Required: 2250,
    Last_Month_Rent: 2250,
    Status: 'Active' as Lease['Status'],
    Notes: 'Standard Provincial Tenancy Agreement'
  });

  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;
  const tenantName = (id: string) => tenants.find(t => t.Tenant_ID === id)?.Full_Name || id;
  const unitName = (id: string) => units.find(u => u.Unit_ID === id)?.Unit_Number_Name || id;
  const selectedProp = properties.find(p => p.Property_ID === form.Property_ID);

  const handlePropertyChange = (propId: string) => {
    const propUnits = units.filter(u => u.Property_ID === propId);
    const firstUnit = propUnits[0];
    const targetRent = firstUnit?.Target_Rent || 2000;
    
    // Auto adapt regional deposit rules:
    const province = properties.find(p => p.Property_ID === propId)?.Province || 'ON';
    let depReq = 0;
    let lmrReq = 0;

    if (province === 'ON') {
      lmrReq = targetRent;
      depReq = 200; // Key deposit
    } else if (province === 'BC') {
      depReq = Math.round(targetRent * 0.5);
      lmrReq = 0;
    } else if (province === 'QC') {
      depReq = 0;
      lmrReq = targetRent;
    } else {
      depReq = targetRent;
      lmrReq = 0;
    }

    setForm(prev => ({
      ...prev,
      Property_ID: propId,
      Unit_ID: firstUnit?.Unit_ID || '',
      Monthly_Rent: targetRent,
      Deposit_Required: depReq,
      Last_Month_Rent: lmrReq
    }));
  };

  const handleOpenAdd = () => {
    setEditingLease(null);
    const defaultProp = properties[0]?.Property_ID || '';
    const propUnits = units.filter(u => u.Property_ID === defaultProp);
    const firstUnit = propUnits[0];
    const targetRent = firstUnit?.Target_Rent || 2250;

    setForm({
      Tenant_ID: tenants[0]?.Tenant_ID || '',
      Property_ID: defaultProp,
      Unit_ID: firstUnit?.Unit_ID || '',
      Lease_Start: new Date().toISOString().slice(0, 10),
      Lease_End: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      Monthly_Rent: targetRent,
      Deposit_Required: targetRent,
      Last_Month_Rent: targetRent,
      Status: 'Active',
      Notes: 'Standard Provincial Tenancy Agreement'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lease: Lease) => {
    setEditingLease(lease);
    setForm({
      Tenant_ID: lease.Tenant_ID,
      Property_ID: lease.Property_ID,
      Unit_ID: lease.Unit_ID,
      Lease_Start: lease.Lease_Start,
      Lease_End: lease.Lease_End || '',
      Monthly_Rent: lease.Monthly_Rent,
      Deposit_Required: lease.Deposit_Required || 0,
      Last_Month_Rent: lease.Last_Month_Rent || 0,
      Status: lease.Status,
      Notes: lease.Notes || ''
    });
    setShowModal(true);
  };

  const handleSaveLease = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLease) {
        const updated: Lease = {
          ...editingLease,
          Tenant_ID: form.Tenant_ID,
          Property_ID: form.Property_ID,
          Unit_ID: form.Unit_ID,
          Lease_Start: form.Lease_Start,
          Lease_End: form.Lease_End,
          Monthly_Rent: form.Monthly_Rent,
          Deposit_Required: form.Deposit_Required,
          Last_Month_Rent: form.Last_Month_Rent,
          Status: form.Status,
          Notes: form.Notes
        };
        storage.updateLease(updated, currentUser.Email);
        onToast(`Lease agreement ${updated.Lease_ID} updated successfully`, 'success');
      } else {
        const res = AccountingEngine.createLeaseWithCharges(
          {
            Tenant_ID: form.Tenant_ID,
            Property_ID: form.Property_ID,
            Unit_ID: form.Unit_ID,
            Lease_Start: form.Lease_Start,
            Lease_End: form.Lease_End,
            Monthly_Rent: form.Monthly_Rent,
            Deposit_Required: form.Deposit_Required,
            Deposit_Received: 0,
            Last_Month_Rent: form.Last_Month_Rent,
            Drive_Folder_URL: `https://drive.google.com/drive/folders/lease-${form.Unit_ID.toLowerCase()}`,
            Notes: form.Notes
          },
          currentUser.Email
        );
        onToast(`Lease ${res.leaseId} created with First Month & LMR/Deposit GL double-entry entries!`, 'success');
      }
      setShowModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to process lease', 'error');
    }
  };

  const handleDeleteLeaseConfirm = () => {
    if (!deletingLease) return;
    storage.deleteLease(deletingLease.Lease_ID, currentUser.Email);
    onToast(`Lease ${deletingLease.Lease_ID} deleted permanently`, 'info');
    setDeletingLease(null);
  };

  const availableUnits = units.filter(u => u.Property_ID === form.Property_ID);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-600" />
            Lease Agreements Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated First + Last Month Rent (LMR) receivables and provincial tenancy compliance</p>
        </div>

        <button
          id="btn-add-new-lease"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Lease
        </button>
      </div>

      {/* Leases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Lease ID</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Property & Unit</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Monthly Rent</th>
                <th className="py-3 px-4 text-right">LMR / Deposit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Google Drive</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No leases created yet. Click "Create New Lease" to initiate an agreement.
                  </td>
                </tr>
              ) : (
                leases.map(lease => (
                  <tr key={lease.Lease_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {lease.Lease_ID}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {tenantName(lease.Tenant_ID)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-bold text-slate-800">{unitName(lease.Unit_ID)}</span> · {propertyName(lease.Property_ID)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-semibold text-slate-900">{lease.Lease_Start}</span> to {lease.Lease_End || 'Ongoing'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {AccountingEngine.formatCurrency(lease.Monthly_Rent)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-indigo-700 font-semibold">
                      {AccountingEngine.formatCurrency((lease.Deposit_Required || 0) + (lease.Last_Month_Rent || 0))}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        lease.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lease.Status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {lease.Drive_Folder_URL ? (
                        <a
                          href={lease.Drive_Folder_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Vault</span>
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(lease)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Lease"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingLease(lease)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Lease"
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

      {/* New / Edit Lease Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingLease ? `Edit Tenancy Agreement: ${editingLease.Lease_ID}` : 'Create Tenancy Agreement'}
                </h3>
                <p className="text-xs text-slate-500">Auto-posts First Month Rent & LMR / Security Deposit to GL</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLease} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tenant</label>
                <select
                  value={form.Tenant_ID}
                  onChange={(e) => setForm({ ...form, Tenant_ID: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  required
                >
                  {tenants.map(t => (
                    <option key={t.Tenant_ID} value={t.Tenant_ID}>{t.Full_Name} ({t.Email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Property</label>
                  <select
                    value={form.Property_ID}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                    required
                  >
                    {properties.map(p => (
                      <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name} ({p.Province})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit / Suite</label>
                  <select
                    value={form.Unit_ID}
                    onChange={(e) => setForm({ ...form, Unit_ID: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                    required
                  >
                    {availableUnits.map(u => (
                      <option key={u.Unit_ID} value={u.Unit_ID}>{u.Unit_Number_Name} (${u.Target_Rent}/mo)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Lease Start</label>
                  <input
                    type="date"
                    required
                    value={form.Lease_Start}
                    onChange={(e) => setForm({ ...form, Lease_Start: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Lease End</label>
                  <input
                    type="date"
                    value={form.Lease_End}
                    onChange={(e) => setForm({ ...form, Lease_End: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={form.Status}
                    onChange={(e) => setForm({ ...form, Status: e.target.value as Lease['Status'] })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monthly Rent ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.Monthly_Rent}
                    onChange={(e) => setForm({ ...form, Monthly_Rent: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Last Month Rent ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.Last_Month_Rent}
                    onChange={(e) => setForm({ ...form, Last_Month_Rent: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Key / Security Dep ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.Deposit_Required}
                    onChange={(e) => setForm({ ...form, Deposit_Required: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1">
                <p className="font-bold">Regional Tenancy Compliance Applied:</p>
                <p>
                  • {selectedProp?.Province === 'ON' ? 'Ontario: Last Month Rent (LMR) collected. Security deposits prohibited, key deposit allowed.' : selectedProp?.Province === 'BC' ? 'British Columbia: Security deposit capped at 50% of monthly rent.' : selectedProp?.Province === 'QC' ? 'Quebec: Deposits prohibited by Civil Code; first month rent only.' : 'Standard commercial / residential tenancy rules apply.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Addendum Clauses</label>
                <textarea
                  rows={2}
                  value={form.Notes}
                  onChange={(e) => setForm({ ...form, Notes: e.target.value })}
                  placeholder="Parking stall, pet addendum, smoking clause..."
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
                  {editingLease ? 'Save Changes' : 'Create Lease & Post Initial Charges'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Lease Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingLease}
        title="Delete Tenancy Agreement"
        itemName={deletingLease ? `Lease ${deletingLease.Lease_ID} (${tenantName(deletingLease.Tenant_ID)})` : ''}
        itemType="lease"
        warningMessage="Deleting this lease agreement will remove its scheduled billing and contract records."
        onConfirm={handleDeleteLeaseConfirm}
        onCancel={() => setDeletingLease(null)}
      />
    </div>
  );
};
