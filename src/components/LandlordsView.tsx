import React, { useState } from 'react';
import {
  UserCheck, Plus, Search, Mail, Phone, MapPin,
  Building, DollarSign, Landmark, CreditCard, Edit3,
  Check, X, FileText, ChevronRight, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { Landlord, Property, User } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface LandlordsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LandlordsView: React.FC<LandlordsViewProps> = ({ currentUser, onToast }) => {
  const landlords = storage.getLandlords();
  const properties = storage.getProperties();
  const landlordPayments = storage.getLandlordPayments();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState<Landlord | null>(null);
  const [deletingLandlord, setDeletingLandlord] = useState<Landlord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Landlord>({
    Landlord_ID: '',
    Full_Name: '',
    Email: '',
    Phone: '',
    Address: '',
    Payment_Method: 'EFT / Direct Deposit',
    Bank_Reference: '',
    Status: 'Active',
    Notes: ''
  });

  const filteredLandlords = landlords.filter(l =>
    l.Full_Name.toLowerCase().includes(search.toLowerCase()) ||
    l.Email.toLowerCase().includes(search.toLowerCase()) ||
    l.Phone.toLowerCase().includes(search.toLowerCase()) ||
    (l.Address && l.Address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdd = () => {
    const nextId = 'LAND-' + String(landlords.length + 1).padStart(3, '0');
    setFormData({
      Landlord_ID: nextId,
      Full_Name: '',
      Email: '',
      Phone: '',
      Address: '',
      Payment_Method: 'EFT / Direct Deposit',
      Bank_Reference: 'RBC Royal Bank Transit #00002 Acct #',
      Status: 'Active',
      Notes: ''
    });
    setEditingLandlord(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (landlord: Landlord) => {
    setEditingLandlord(landlord);
    setFormData({ ...landlord });
    setShowAddModal(true);
  };

  const handleSaveLandlord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Full_Name.trim() || !formData.Email.trim()) {
      onToast('Please provide a landlord name and email', 'error');
      return;
    }

    if (editingLandlord) {
      storage.updateLandlord(formData, currentUser.Email);
      onToast(`Landlord ${formData.Full_Name} updated successfully`, 'success');
    } else {
      storage.addLandlord(formData, currentUser.Email);
      onToast(`New landlord ${formData.Full_Name} registered`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteLandlordConfirm = () => {
    if (!deletingLandlord) return;
    storage.deleteLandlord(deletingLandlord.Landlord_ID, currentUser.Email);
    onToast(`Landlord ${deletingLandlord.Full_Name} deleted permanently`, 'info');
    setDeletingLandlord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Landlords & Asset Owners Directory</h2>
              <p className="text-xs text-slate-500">Manage property owners, banking EFT transit routing, management commission terms, and disbursement schedules</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Landlord Owner
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered Owners</p>
          <p className="text-xl font-black text-slate-900 mt-1">{landlords.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{landlords.filter(l => l.Status === 'Active').length} Active Accounts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Properties Under Management</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{properties.length} Portfolios</p>
          <span className="text-[10px] text-slate-500">Across Canada</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total YTD Disbursements</p>
          <p className="text-xl font-black text-emerald-700 mt-1">
            {AccountingEngine.formatCurrency(
              landlordPayments.reduce((sum, p) => sum + (p.Net_Payout_Amount || p.Net_Amount || 0), 0)
            )}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">{landlordPayments.length} Net Payouts Processed</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search landlord by name, email, phone, or banking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Landlords Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLandlords.map(landlord => {
          const ownedProperties = properties.filter(p => p.Landlord_ID === landlord.Landlord_ID);
          const payments = landlordPayments.filter(p => p.Landlord_ID === landlord.Landlord_ID);
          const totalPaid = payments.reduce((sum, p) => sum + (p.Net_Payout_Amount || p.Net_Amount || 0), 0);

          return (
            <div
              key={landlord.Landlord_ID}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{landlord.Full_Name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {landlord.Status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{landlord.Landlord_ID}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(landlord)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Landlord Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingLandlord(landlord)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Landlord"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <a href={`mailto:${landlord.Email}`} className="text-indigo-600 hover:underline truncate">
                    {landlord.Email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{landlord.Phone}</span>
                </div>
                {landlord.Address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{landlord.Address}</span>
                  </div>
                )}
              </div>

              {/* Banking & Payout Details */}
              <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Banking & Settlement Routing</p>
                <div className="flex items-center justify-between text-slate-700 pt-0.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    {landlord.Payment_Method}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                  {landlord.Bank_Reference || 'Direct Wire on File'}
                </p>
              </div>

              {/* Owned Properties List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owned Real Estate Assets ({ownedProperties.length})</p>
                {ownedProperties.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ownedProperties.map(p => (
                      <span key={p.Property_ID} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        <Building className="w-3 h-3 text-indigo-500" />
                        {p.Property_Name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No properties linked yet</p>
                )}
              </div>

              {/* Total Paid YTD */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">YTD Net Payout:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {AccountingEngine.formatCurrency(totalPaid)}
                </span>
              </div>

              {landlord.Notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                  "{landlord.Notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Landlord Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingLandlord ? `Edit ${editingLandlord.Full_Name}` : 'Register New Landlord / Owner'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLandlord} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner / Corporate Legal Name *</label>
                <input
                  type="text"
                  value={formData.Full_Name}
                  onChange={(e) => setFormData({ ...formData, Full_Name: e.target.value })}
                  placeholder="e.g. Michael Chen or Westcoast Asset Corp"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    placeholder="e.g. owner@holdingcompany.ca"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.Phone}
                    onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    placeholder="e.g. (416) 555-0110"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mailing / Business Address</label>
                <input
                  type="text"
                  value={formData.Address || ''}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="e.g. 22 King St W, Suite 1400, Toronto, ON"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Disbursement Method</label>
                  <select
                    value={formData.Payment_Method}
                    onChange={(e) => setFormData({ ...formData, Payment_Method: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="EFT / Direct Deposit">EFT / Direct Deposit</option>
                    <option value="Interac e-Transfer">Interac e-Transfer</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.Status}
                    onChange={(e) => setFormData({ ...formData, Status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Transit & Account Details</label>
                <input
                  type="text"
                  value={formData.Bank_Reference || ''}
                  onChange={(e) => setFormData({ ...formData, Bank_Reference: e.target.value })}
                  placeholder="e.g. TD Transit #90123 Institution #004 Acct #5839201"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Contract Provisions</label>
                <textarea
                  value={formData.Notes || ''}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="e.g. Standard 8% management commission fee deducted at source"
                  rows={2}
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
                  {editingLandlord ? 'Save Changes' : 'Register Landlord'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Landlord Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingLandlord}
        title="Delete Landlord Owner"
        itemName={deletingLandlord ? `${deletingLandlord.Full_Name} (${deletingLandlord.Landlord_ID})` : ''}
        itemType="landlord"
        warningMessage="Deleting this landlord profile will disconnect linked properties and banking routing."
        onConfirm={handleDeleteLandlordConfirm}
        onCancel={() => setDeletingLandlord(null)}
      />
    </div>
  );
};
