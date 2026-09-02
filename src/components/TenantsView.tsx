import React, { useState } from 'react';
import {
  Users, Plus, ShieldCheck, FileText, CheckCircle2,
  AlertCircle, ExternalLink, Calendar, Phone, Mail,
  CreditCard, Search, ArrowUpRight, Edit3, Trash2, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { Tenant, TenantIDProof, TenantIdType, User } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface TenantsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TenantsView: React.FC<TenantsViewProps> = ({ currentUser, onToast }) => {
  const tenants = storage.getTenants();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const idProofs = storage.getTenantIDProofs();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(tenants[0] || null);

  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddIDModal, setShowAddIDModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [deletingProof, setDeletingProof] = useState<TenantIDProof | null>(null);

  // Tenant Form
  const [tenantForm, setTenantForm] = useState<{
    Full_Name: string;
    Email: string;
    Phone: string;
    Emergency_Contact: string;
    Status: Tenant['Status'];
    Notes: string;
  }>({
    Full_Name: '',
    Email: '',
    Phone: '',
    Emergency_Contact: '',
    Status: 'Prospect',
    Notes: ''
  });

  // ID Proof Form
  const [idForm, setIdForm] = useState<{
    idType: TenantIdType;
    idNumber: string;
    issueDate: string;
    expiryDate: string;
    fileURL: string;
  }>({
    idType: 'Driver License',
    idNumber: '',
    issueDate: '2023-01-01',
    expiryDate: '2028-01-01',
    fileURL: ''
  });

  const propertyName = (id?: string) => properties.find(p => p.Property_ID === id)?.Property_Name || '—';
  const unitName = (id?: string) => units.find(u => u.Unit_ID === id)?.Unit_Number_Name || id || '—';

  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.Full_Name.toLowerCase().includes(q) ||
      t.Email.toLowerCase().includes(q) ||
      t.Phone.toLowerCase().includes(q)
    );
  });

  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    setTenantForm({
      Full_Name: '',
      Email: '',
      Phone: '',
      Emergency_Contact: '',
      Status: 'Prospect',
      Notes: ''
    });
    setShowAddTenantModal(true);
  };

  const handleOpenEditTenant = (t: Tenant) => {
    setEditingTenant(t);
    setTenantForm({
      Full_Name: t.Full_Name,
      Email: t.Email,
      Phone: t.Phone,
      Emergency_Contact: t.Emergency_Contact || '',
      Status: t.Status,
      Notes: t.Notes || ''
    });
    setShowAddTenantModal(true);
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      const updated: Tenant = {
        ...editingTenant,
        Full_Name: tenantForm.Full_Name,
        Email: tenantForm.Email,
        Phone: tenantForm.Phone,
        Emergency_Contact: tenantForm.Emergency_Contact,
        Status: tenantForm.Status,
        Notes: tenantForm.Notes
      };
      storage.updateTenant(updated, currentUser.Email);
      onToast(`Tenant ${updated.Full_Name} updated successfully`, 'success');
      if (selectedTenant?.Tenant_ID === updated.Tenant_ID) {
        setSelectedTenant(updated);
      }
    } else {
      const newId = 'TEN-' + Date.now().toString(36).toUpperCase();
      const newTenant: Tenant = {
        Tenant_ID: newId,
        Full_Name: tenantForm.Full_Name,
        Email: tenantForm.Email,
        Phone: tenantForm.Phone,
        Emergency_Contact: tenantForm.Emergency_Contact,
        Status: tenantForm.Status,
        Created_At: new Date().toISOString().slice(0, 10),
        Notes: tenantForm.Notes
      };
      storage.addTenant(newTenant, currentUser.Email);
      onToast(`Tenant ${newTenant.Full_Name} registered.`, 'success');
      setSelectedTenant(newTenant);
    }
    setShowAddTenantModal(false);
  };

  const handleDeleteTenantConfirm = () => {
    if (!deletingTenant) return;
    storage.deleteTenant(deletingTenant.Tenant_ID, currentUser.Email);
    onToast(`Tenant ${deletingTenant.Full_Name} deleted permanently`, 'info');
    if (selectedTenant?.Tenant_ID === deletingTenant.Tenant_ID) {
      setSelectedTenant(null);
    }
    setDeletingTenant(null);
  };

  const handleSaveIDProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const proofId = 'IDPROOF-' + Date.now().toString(36).toUpperCase();
    const proof: TenantIDProof = {
      ID_Proof_ID: proofId,
      Tenant_ID: selectedTenant.Tenant_ID,
      ID_Type: idForm.idType,
      ID_Number: idForm.idNumber,
      Issue_Date: idForm.issueDate,
      Expiry_Date: idForm.expiryDate,
      File_URL: idForm.fileURL || 'https://drive.google.com/drive/folders/demo-id-vault',
      Verified: true,
      Created_Date: new Date().toISOString().slice(0, 10)
    };

    storage.addTenantIDProof(proof, currentUser.Email);
    onToast(`ID Proof (${idForm.idType}) recorded & verified.`, 'success');
    setShowAddIDModal(false);
    setIdForm({
      idType: 'Driver License',
      idNumber: '',
      issueDate: '2023-01-01',
      expiryDate: '2028-01-01',
      fileURL: ''
    });
  };

  const handleDeleteProofConfirm = () => {
    if (!deletingProof) return;
    storage.deleteTenantIDProof(deletingProof.ID_Proof_ID, currentUser.Email);
    onToast(`ID proof (${deletingProof.ID_Type}) removed`, 'info');
    setDeletingProof(null);
  };

  const currentTenantProofs = selectedTenant
    ? idProofs.filter(p => p.Tenant_ID === selectedTenant.Tenant_ID)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tenant name, email or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600 shadow-xs"
          />
        </div>

        <button
          onClick={handleOpenAddTenant}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tenant
        </button>
      </div>

      {/* Main Grid: Left Tenant List, Right ID & Compliance Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Table / Cards */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Active Tenant Directory ({filteredTenants.length})
            </h3>
            <span className="text-[11px] text-slate-400">Click a tenant to view ID documents</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredTenants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No tenants found matching "{searchQuery}".
              </div>
            ) : (
              filteredTenants.map(tenant => {
                const isSelected = selectedTenant?.Tenant_ID === tenant.Tenant_ID;
                const tenantProofs = idProofs.filter(p => p.Tenant_ID === tenant.Tenant_ID);

                return (
                  <div
                    key={tenant.Tenant_ID}
                    onClick={() => setSelectedTenant(tenant)}
                    className={`p-4 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{tenant.Full_Name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          tenant.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tenant.Status}
                        </span>
                        {tenantProofs.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            ID Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {tenant.Email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {tenant.Phone}
                        </span>
                      </div>

                      {tenant.Current_Unit_ID && (
                        <p className="text-[11px] text-indigo-900 font-medium pt-0.5">
                          Suite: <span className="font-bold">{unitName(tenant.Current_Unit_ID)}</span> · {propertyName(tenant.Current_Property_ID)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditTenant(tenant)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Tenant"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingTenant(tenant)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Tenant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tenant ID Proof & KYC Vault */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tenant ID Proof & KYC
              </h3>
              {selectedTenant && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditTenant(selectedTenant)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    id="btn-add-id-proof"
                    onClick={() => setShowAddIDModal(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add ID
                  </button>
                </div>
              )}
            </div>

            {selectedTenant ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{selectedTenant.Full_Name}</p>
                    <span className="text-[10px] font-mono text-slate-400">{selectedTenant.Tenant_ID}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Emergency: {selectedTenant.Emergency_Contact || 'None'}</p>
                  {selectedTenant.Notes && (
                    <p className="text-[11px] text-slate-600 mt-1 italic">"{selectedTenant.Notes}"</p>
                  )}
                </div>

                {currentTenantProofs.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                    <CreditCard className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No ID Proof on File</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Upload Driver's License, Passport, or PR Card.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentTenantProofs.map(proof => (
                      <div key={proof.ID_Proof_ID} className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/80 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{proof.ID_Type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Verified
                            </span>
                            <button
                              onClick={() => setDeletingProof(proof)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                              title="Delete ID Proof"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-semibold text-slate-700 mt-1">{proof.ID_Number}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span>Expires: {proof.Expiry_Date}</span>
                          {proof.File_URL && (
                            <a
                              href={proof.File_URL}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                            >
                              Drive Document <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Select a tenant from the directory to review credentials.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTenant ? `Edit Tenant: ${editingTenant.Full_Name}` : 'Register New Tenant'}
              </h3>
              <button onClick={() => setShowAddTenantModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveTenant} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={tenantForm.Full_Name}
                  onChange={(e) => setTenantForm({ ...tenantForm, Full_Name: e.target.value })}
                  placeholder="e.g. Jean-Luc Picard"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={tenantForm.Email}
                    onChange={(e) => setTenantForm({ ...tenantForm, Email: e.target.value })}
                    placeholder="jean@example.ca"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={tenantForm.Phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, Phone: e.target.value })}
                    placeholder="+1 (416) 555-0199"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={tenantForm.Status}
                    onChange={(e) => setTenantForm({ ...tenantForm, Status: e.target.value as Tenant['Status'] })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Active">Active</option>
                    <option value="Past">Past</option>
                    <option value="Evicted">Evicted</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={tenantForm.Emergency_Contact}
                    onChange={(e) => setTenantForm({ ...tenantForm, Emergency_Contact: e.target.value })}
                    placeholder="e.g. Sarah +1 416-555-0188"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Special Accommodations</label>
                <textarea
                  value={tenantForm.Notes}
                  onChange={(e) => setTenantForm({ ...tenantForm, Notes: e.target.value })}
                  placeholder="e.g. Has approved service dog, parking spot requested"
                  rows={2}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {editingTenant ? 'Save Changes' : 'Save Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add ID Proof Modal */}
      {showAddIDModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add ID Proof Document</h3>
                <p className="text-xs text-slate-500">For {selectedTenant.Full_Name}</p>
              </div>
              <button onClick={() => setShowAddIDModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveIDProof} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ID Type</label>
                <select
                  value={idForm.idType}
                  onChange={(e) => setIdForm({ ...idForm, idType: e.target.value as TenantIdType })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="Driver License">Driver's License (Regional/State/Provincial)</option>
                  <option value="Passport">Passport (Domestic / Foreign)</option>
                  <option value="Provincial Photo ID">Regional Photo ID Card</option>
                  <option value="PR Card">Permanent Resident (PR) Card</option>
                  <option value="Work Permit">Work Permit / Visa</option>
                  <option value="National ID">National Identity Card</option>
                  <option value="Other">Other Government Document</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Document / License Number</label>
                <input
                  type="text"
                  required
                  value={idForm.idNumber}
                  onChange={(e) => setIdForm({ ...idForm, idNumber: e.target.value })}
                  placeholder="e.g. T4829-10928-39201"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={idForm.issueDate}
                    onChange={(e) => setIdForm({ ...idForm, issueDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={idForm.expiryDate}
                    onChange={(e) => setIdForm({ ...idForm, expiryDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Google Drive / Cloud Document URL</label>
                <input
                  type="url"
                  value={idForm.fileURL}
                  onChange={(e) => setIdForm({ ...idForm, fileURL: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Upload scanned copy to Google Drive and paste link.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddIDModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save & Verify ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Tenant Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingTenant}
        title="Delete Tenant Profile"
        itemName={deletingTenant ? `${deletingTenant.Full_Name} (${deletingTenant.Tenant_ID})` : ''}
        itemType="tenant"
        warningMessage="Deleting this tenant profile will remove all personal records and linked KYC documents."
        onConfirm={handleDeleteTenantConfirm}
        onCancel={() => setDeletingTenant(null)}
      />

      {/* Confirm Delete ID Proof Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingProof}
        title="Delete ID Proof Document"
        itemName={deletingProof ? `${deletingProof.ID_Type} (${deletingProof.ID_Number})` : ''}
        itemType="ID proof"
        warningMessage="Deleting this document will remove it from the tenant's compliance vault."
        onConfirm={handleDeleteProofConfirm}
        onCancel={() => setDeletingProof(null)}
      />
    </div>
  );
};
