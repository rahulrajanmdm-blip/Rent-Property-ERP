import React, { useState } from 'react';
import {
  DollarSign, Plus, CheckCircle2, Clock, Filter,
  Building, UserCheck, AlertCircle, FileText, ArrowDownRight,
  Edit3, Trash2, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { LandlordPayment, User } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface LandlordPaymentsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LandlordPaymentsView: React.FC<LandlordPaymentsViewProps> = ({ currentUser, onToast }) => {
  const landlordPayments = storage.getLandlordPayments();
  const properties = storage.getProperties();
  const landlords = storage.getLandlords();

  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<LandlordPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<LandlordPayment | null>(null);
  const [filterPeriod, setFilterPeriod] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    propertyId: properties[0]?.Property_ID || '',
    landlordId: landlords[0]?.Landlord_ID || '',
    period: new Date().toISOString().slice(0, 7),
    rentAmount: 5100,
    deductions: 408,
    status: 'Posted' as LandlordPayment['Status'],
    notes: ''
  });

  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;
  const landlordName = (id: string) => landlords.find(l => l.Landlord_ID === id)?.Full_Name || id;

  const handlePropertyChange = (propId: string) => {
    const prop = properties.find(p => p.Property_ID === propId);
    if (prop) {
      const defaultRent = prop.Master_Rent_Amount || 3000;
      const defaultDed = Math.round(defaultRent * 0.08);
      setFormData(prev => ({
        ...prev,
        propertyId: propId,
        landlordId: prop.Landlord_ID || prev.landlordId,
        rentAmount: defaultRent,
        deductions: defaultDed
      }));
    }
  };

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setFormData({
      propertyId: properties[0]?.Property_ID || '',
      landlordId: landlords[0]?.Landlord_ID || '',
      period: new Date().toISOString().slice(0, 7),
      rentAmount: properties[0]?.Master_Rent_Amount || 5000,
      deductions: Math.round((properties[0]?.Master_Rent_Amount || 5000) * 0.08),
      status: 'Posted',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: LandlordPayment) => {
    setEditingPayment(p);
    setFormData({
      propertyId: p.Property_ID,
      landlordId: p.Landlord_ID,
      period: p.Period,
      rentAmount: p.Rent_Amount,
      deductions: p.Deductions,
      status: p.Status,
      notes: p.Notes || ''
    });
    setShowModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calculatedNet = Math.max(0, formData.rentAmount - formData.deductions);
      if (editingPayment) {
        const updated: LandlordPayment = {
          ...editingPayment,
          Property_ID: formData.propertyId,
          Landlord_ID: formData.landlordId,
          Period: formData.period,
          Rent_Amount: formData.rentAmount,
          Deductions: formData.deductions,
          Net_Amount: calculatedNet,
          Net_Payout_Amount: calculatedNet,
          Status: formData.status,
          Notes: formData.notes
        };
        storage.updateLandlordPayment(updated, currentUser.Email);
        onToast(`Landlord payment ${updated.Landlord_Pay_ID} updated successfully`, 'success');
      } else {
        const res = AccountingEngine.createLandlordPayment(
          formData.propertyId,
          formData.landlordId,
          formData.period,
          formData.rentAmount,
          formData.deductions,
          formData.notes,
          currentUser.Email
        );
        onToast(`Landlord payment ${res.paymentId} created ($${res.netAmount} net payout posted).`, 'success');
      }
      setShowModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to process payment', 'error');
    }
  };

  const handleDeletePaymentConfirm = () => {
    if (!deletingPayment) return;
    storage.deleteLandlordPayment(deletingPayment.Landlord_Pay_ID, currentUser.Email);
    onToast(`Landlord payout ${deletingPayment.Landlord_Pay_ID} deleted`, 'info');
    setDeletingPayment(null);
  };

  const netAmountCalculated = Math.max(0, (Number(formData.rentAmount) || 0) - (Number(formData.deductions) || 0));

  const filteredPayments = landlordPayments.filter(p => {
    if (filterPeriod !== 'ALL' && p.Period !== filterPeriod) return false;
    return true;
  });

  const totalGross = landlordPayments.reduce((s, p) => s + (p.Rent_Amount || 0), 0);
  const totalDeductions = landlordPayments.reduce((s, p) => s + (p.Deductions || 0), 0);
  const totalNet = landlordPayments.reduce((s, p) => s + (p.Net_Amount || p.Net_Payout_Amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Gross Rent Distributed</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{AccountingEngine.formatCurrency(totalGross)}</p>
          <p className="text-xs text-slate-400 mt-1">From active tenant collections</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Management & Maintenance Deductions</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{AccountingEngine.formatCurrency(totalDeductions)}</p>
          <p className="text-xs text-slate-400 mt-1">Retained fee revenue & repairs</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Net Landlord Payouts (EFT)</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{AccountingEngine.formatCurrency(totalNet)}</p>
          <p className="text-xs text-slate-400 mt-1">Directly disbursed to owners</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Landlord Rent Payment Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Calculates gross rent less property management fee and repair holdbacks</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-new-landlord-payment"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Landlord Payment
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Landlord</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Gross Rent</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No landlord payments recorded yet. Click "New Landlord Payment" to record a payout.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.Landlord_Pay_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.Landlord_Pay_ID}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {propertyName(p.Property_ID)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {landlordName(p.Landlord_ID)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-700">
                      {p.Period}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {AccountingEngine.formatCurrency(p.Rent_Amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 font-medium">
                      -{AccountingEngine.formatCurrency(p.Deductions)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {AccountingEngine.formatCurrency(p.Net_Amount || p.Net_Payout_Amount || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.Status === 'Posted' || p.Status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.Status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {p.Payment_Date}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Payment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPayment(p)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Payment Record"
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

      {/* New / Edit Landlord Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPayment ? `Edit Payout: ${editingPayment.Landlord_Pay_ID}` : 'Record Landlord Rent Disbursement'}
                </h3>
                <p className="text-xs text-slate-500">Calculates net payout and posts GL double-entry journal</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                  required
                >
                  {properties.map(p => (
                    <option key={p.Property_ID} value={p.Property_ID}>
                      {p.Property_Name} ({p.City}, {p.Province})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Landlord / Owner</label>
                <select
                  value={formData.landlordId}
                  onChange={(e) => setFormData({ ...formData, landlordId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                  required
                >
                  {landlords.map(l => (
                    <option key={l.Landlord_ID} value={l.Landlord_ID}>
                      {l.Full_Name} ({l.Payment_Method})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Period (YYYY-MM)</label>
                  <input
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Gross Rent Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Deductions (Fee / Repairs) ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LandlordPayment['Status'] })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                  >
                    <option value="Posted">Posted</option>
                    <option value="Paid">Paid</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Net Breakdown Callout */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Rent:</span>
                  <span>{AccountingEngine.formatCurrency(formData.rentAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Deductions:</span>
                  <span className="text-rose-600">-{AccountingEngine.formatCurrency(formData.deductions)}</span>
                </div>
                <div className="border-t border-indigo-200/60 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Net Payout to Owner:</span>
                  <span className="text-emerald-700">{AccountingEngine.formatCurrency(netAmountCalculated)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Statement Memo</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Regular monthly disbursement after 8% fee and $150 HVAC repair holdback."
                  rows={2}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingPayment ? 'Save Changes' : 'Disburse & Post to GL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Landlord Payment Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingPayment}
        title="Delete Landlord Payment"
        itemName={deletingPayment ? `Disbursement ${deletingPayment.Landlord_Pay_ID} (${AccountingEngine.formatCurrency(deletingPayment.Net_Amount || deletingPayment.Net_Payout_Amount || 0)})` : ''}
        itemType="payment"
        warningMessage="Deleting this disbursement record will remove it from the payment ledger and owner accounting history."
        onConfirm={handleDeletePaymentConfirm}
        onCancel={() => setDeletingPayment(null)}
      />
    </div>
  );
};
