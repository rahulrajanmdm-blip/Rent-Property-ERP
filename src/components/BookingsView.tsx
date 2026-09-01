import React, { useState } from 'react';
import {
  Calendar, Plus, Search, Mail, Phone, Building2,
  DoorOpen, DollarSign, CheckCircle2, XCircle, Clock,
  UserCheck, ArrowRight, X, Check, Edit3, ShieldAlert, Sparkles, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { Booking, Property, Unit, User, Tenant, Lease } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface BookingsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ currentUser, onToast }) => {
  const bookings = storage.getBookings();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);

  // Form State
  const [formData, setFormData] = useState<Booking>({
    Booking_ID: '',
    Applicant_Name: '',
    Email: '',
    Phone: '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_ID: units[0]?.Unit_ID || '',
    Booking_Date: new Date().toISOString().split('T')[0],
    Expected_Move_In: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    Quoted_Rent: 2200,
    Deposit_Required: 2200,
    Status: 'Pending',
    Notes: '',
    Created_By: currentUser.Email,
    Created_At: new Date().toISOString()
  });

  const filteredBookings = bookings.filter(b => {
    const prop = properties.find(p => p.Property_ID === b.Property_ID);
    const propName = prop ? prop.Property_Name.toLowerCase() : '';
    const matchSearch =
      b.Applicant_Name.toLowerCase().includes(search.toLowerCase()) ||
      b.Email.toLowerCase().includes(search.toLowerCase()) ||
      b.Phone.toLowerCase().includes(search.toLowerCase()) ||
      propName.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || b.Status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    const nextId = 'BKG-' + String(bookings.length + 1).padStart(3, '0');
    const defaultProp = properties[0]?.Property_ID || '';
    const defaultUnit = units.find(u => u.Property_ID === defaultProp)?.Unit_ID || units[0]?.Unit_ID || '';
    const unitObj = units.find(u => u.Unit_ID === defaultUnit);
    const rent = unitObj ? (unitObj.Target_Rent || unitObj.Monthly_Rent || 2200) : 2200;

    setFormData({
      Booking_ID: nextId,
      Applicant_Name: '',
      Email: '',
      Phone: '',
      Property_ID: defaultProp,
      Unit_ID: defaultUnit,
      Booking_Date: new Date().toISOString().split('T')[0],
      Expected_Move_In: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      Quoted_Rent: rent,
      Deposit_Required: rent,
      Status: 'Pending',
      Notes: 'Credit score verified (740+). Employment proof on file.',
      Created_By: currentUser.Email,
      Created_At: new Date().toISOString()
    });
    setEditingBooking(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (bkg: Booking) => {
    setEditingBooking(bkg);
    setFormData({ ...bkg });
    setShowAddModal(true);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Applicant_Name.trim() || !formData.Email.trim()) {
      onToast('Please enter applicant name and email', 'error');
      return;
    }

    if (editingBooking) {
      storage.updateBooking(formData, currentUser.Email);
      onToast(`Booking for ${formData.Applicant_Name} updated`, 'success');
    } else {
      storage.addBooking(formData, currentUser.Email);
      onToast(`Applicant booking registered for ${formData.Applicant_Name}`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteBookingConfirm = () => {
    if (!deletingBooking) return;
    storage.deleteBooking(deletingBooking.Booking_ID, currentUser.Email);
    onToast(`Booking for ${deletingBooking.Applicant_Name} deleted`, 'info');
    setDeletingBooking(null);
  };

  const handleConvertToLease = (bkg: Booking) => {
    // 1. Create or Find Tenant
    let existingTenant = tenants.find(t => t.Email.toLowerCase() === bkg.Email.toLowerCase());
    let tenantId = existingTenant?.Tenant_ID;

    if (!existingTenant) {
      tenantId = 'TEN-' + String(tenants.length + 1).padStart(3, '0');
      const newTenant: Tenant = {
        Tenant_ID: tenantId,
        Full_Name: bkg.Applicant_Name,
        Email: bkg.Email,
        Phone: bkg.Phone,
        Emergency_Contact: 'Next of Kin - On File',
        Status: 'Active',
        Current_Property_ID: bkg.Property_ID,
        Current_Unit_ID: bkg.Unit_ID,
        Created_At: new Date().toISOString(),
        Notes: `Converted from Applicant Booking ${bkg.Booking_ID}`
      };
      storage.addTenant(newTenant, currentUser.Email);
    }

    // 2. Create Lease
    const leaseId = 'LSE-' + String(storage.getLeases().length + 1).padStart(3, '0');
    const newLease: Lease = {
      Lease_ID: leaseId,
      Tenant_ID: tenantId!,
      Property_ID: bkg.Property_ID,
      Unit_ID: bkg.Unit_ID,
      Lease_Start: bkg.Expected_Move_In,
      Lease_End: new Date(new Date(bkg.Expected_Move_In).setFullYear(new Date(bkg.Expected_Move_In).getFullYear() + 1)).toISOString().split('T')[0],
      Monthly_Rent: bkg.Quoted_Rent,
      Deposit_Required: bkg.Deposit_Required,
      Deposit_Received: bkg.Deposit_Required,
      Last_Month_Rent: bkg.Deposit_Required,
      Status: 'Active',
      Notes: `Created from converted booking ${bkg.Booking_ID}. Quoted Rent: $${bkg.Quoted_Rent}`,
      Created_At: new Date().toISOString()
    };
    storage.addLease(newLease, currentUser.Email);

    // 3. Mark booking confirmed
    const updatedBooking: Booking = { ...bkg, Status: 'Confirmed', Notes: (bkg.Notes ? bkg.Notes + ' · ' : '') + `Converted to Lease ${leaseId}` };
    storage.updateBooking(updatedBooking, currentUser.Email);

    onToast(`🎉 Converted ${bkg.Applicant_Name} into active Lease ${leaseId}! Unit marked Occupied.`, 'success');
  };

  const getStatusBadge = (status: Booking['Status']) => {
    switch (status) {
      case 'Confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'Pending':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
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
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Applicant Bookings & Prospect CRM</h2>
              <p className="text-xs text-slate-500">Track viewing appointments, rental applications, background checks, and convert prospects to active leases</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Applicant Booking
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Applicants</p>
          <p className="text-xl font-black text-slate-900 mt-1">{bookings.length}</p>
          <span className="text-[10px] text-slate-500">Inbound Leads</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
          <p className="text-xl font-black text-amber-700 mt-1">
            {bookings.filter(b => b.Status === 'Pending').length}
          </p>
          <span className="text-[10px] text-amber-600 font-semibold">Under KYC / Credit Check</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Confirmed Leases</p>
          <p className="text-xl font-black text-emerald-700 mt-1">
            {bookings.filter(b => b.Status === 'Confirmed').length}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Converted to Tenants</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Pipeline Value</p>
          <p className="text-xl font-black text-indigo-700 mt-1">
            {AccountingEngine.formatCurrency(
              bookings.filter(b => b.Status !== 'Cancelled').reduce((sum, b) => sum + (b.Quoted_Rent || 0), 0)
            )}
          </p>
          <span className="text-[10px] text-indigo-500">Monthly Recurring Pipeline</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by applicant name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBookings.map(bkg => {
          const prop = properties.find(p => p.Property_ID === bkg.Property_ID);
          const unit = units.find(u => u.Unit_ID === bkg.Unit_ID);

          return (
            <div
              key={bkg.Booking_ID}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{bkg.Applicant_Name}</span>
                      {getStatusBadge(bkg.Status)}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{bkg.Booking_ID}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(bkg)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Booking"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingBooking(bkg)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Box */}
                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <a href={`mailto:${bkg.Email}`} className="text-indigo-600 hover:underline truncate">
                      {bkg.Email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{bkg.Phone}</span>
                  </div>
                </div>

                {/* Target Unit & Move-In Date */}
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Target Unit:
                    </span>
                    <span className="font-bold text-slate-900">
                      {unit ? (unit.Unit_Number_Name || unit.Unit_Number || unit.Unit_ID) : bkg.Unit_ID}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Property:</span>
                    <span className="font-semibold text-slate-700">{prop?.Property_Name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Desired Move-In:</span>
                    <span className="font-bold text-indigo-700">{bkg.Expected_Move_In}</span>
                  </div>
                </div>

                {/* Pricing & Deposit */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">QUOTED RENT</span>
                    <span className="font-mono font-bold text-slate-900">
                      {AccountingEngine.formatCurrency(bkg.Quoted_Rent)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DEPOSIT REQ</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {AccountingEngine.formatCurrency(bkg.Deposit_Required)}
                    </span>
                  </div>
                </div>

                {bkg.Notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    "{bkg.Notes}"
                  </p>
                )}
              </div>

              {/* Action Footer */}
              {bkg.Status === 'Pending' && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleConvertToLease(bkg)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <UserCheck className="w-4 h-4" />
                    Approve & Convert to Active Lease
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingBooking ? `Edit Booking ${editingBooking.Booking_ID}` : 'Register New Applicant Booking'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant Full Name *</label>
                <input
                  type="text"
                  value={formData.Applicant_Name}
                  onChange={(e) => setFormData({ ...formData, Applicant_Name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
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
                    placeholder="e.g. sarah.jenkins@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.Phone}
                    onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    placeholder="e.g. (416) 555-0921"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Property</label>
                  <select
                    value={formData.Property_ID}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const uList = units.filter(u => u.Property_ID === pId);
                      setFormData({
                        ...formData,
                        Property_ID: pId,
                        Unit_ID: uList[0]?.Unit_ID || ''
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {properties.map(p => (
                      <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Suite</label>
                  <select
                    value={formData.Unit_ID}
                    onChange={(e) => {
                      const uId = e.target.value;
                      const uObj = units.find(u => u.Unit_ID === uId);
                      const r = uObj ? (uObj.Target_Rent || uObj.Monthly_Rent || 2200) : 2200;
                      setFormData({ ...formData, Unit_ID: uId, Quoted_Rent: r, Deposit_Required: r });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {units.filter(u => u.Property_ID === formData.Property_ID).map(u => (
                      <option key={u.Unit_ID} value={u.Unit_ID}>
                        {u.Unit_Number_Name || u.Unit_Number || u.Unit_ID} ({u.Current_Status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Move-In Date</label>
                  <input
                    type="date"
                    value={formData.Expected_Move_In}
                    onChange={(e) => setFormData({ ...formData, Expected_Move_In: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Status</label>
                  <select
                    value={formData.Status}
                    onChange={(e) => setFormData({ ...formData, Status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quoted Monthly Rent (CAD) *</label>
                  <input
                    type="number"
                    value={formData.Quoted_Rent}
                    onChange={(e) => setFormData({ ...formData, Quoted_Rent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deposit Required (CAD) *</label>
                  <input
                    type="number"
                    value={formData.Deposit_Required}
                    onChange={(e) => setFormData({ ...formData, Deposit_Required: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant Notes / Screening Verification</label>
                <textarea
                  value={formData.Notes || ''}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="e.g. Equifax credit report score 780. Tech industry employment verified. Non-smoker."
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
                  {editingBooking ? 'Save Changes' : 'Register Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Booking Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingBooking}
        title="Delete Applicant Booking"
        itemName={deletingBooking ? `Booking for ${deletingBooking.Applicant_Name} (${deletingBooking.Booking_ID})` : ''}
        itemType="booking"
        warningMessage="Deleting this application booking will remove it from the reservation queue."
        onConfirm={handleDeleteBookingConfirm}
        onCancel={() => setDeletingBooking(null)}
      />
    </div>
  );
};
