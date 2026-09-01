import React, { useState } from 'react';
import {
  DoorOpen, Plus, Search, Filter, Edit3, CheckCircle2,
  AlertCircle, Building2, DollarSign, Home, Bed, Bath,
  Layers, ChevronRight, X, Sparkles, Check, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { Unit, Property, User } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface UnitsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UnitsView: React.FC<UnitsViewProps> = ({ currentUser, onToast }) => {
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const leases = storage.getLeases();
  const tenants = storage.getTenants();

  const [search, setSearch] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    Unit_ID: string;
    Property_ID: string;
    Unit_Number: string;
    Floor_Plan: string;
    Monthly_Rent: number;
    Current_Status: 'Vacant' | 'Occupied' | 'Maintenance' | 'Inactive';
    Bedrooms: number;
    Bathrooms: number;
    Square_Feet: number;
    Notes: string;
  }>({
    Unit_ID: '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_Number: '',
    Floor_Plan: '1 Bedroom Modern',
    Monthly_Rent: 2200,
    Current_Status: 'Vacant',
    Bedrooms: 1,
    Bathrooms: 1,
    Square_Feet: 650,
    Notes: ''
  });

  const filteredUnits = units.filter(u => {
    const prop = properties.find(p => p.Property_ID === u.Property_ID);
    const propName = prop ? prop.Property_Name.toLowerCase() : '';
    const unitName = (u.Unit_Number_Name || u.Unit_Number || u.Unit_ID).toLowerCase();
    const floorPlan = (u.Unit_Type || u.Floor_Plan || '').toLowerCase();
    const matchSearch =
      unitName.includes(search.toLowerCase()) ||
      floorPlan.includes(search.toLowerCase()) ||
      propName.includes(search.toLowerCase());
    const matchProp = filterProperty === 'ALL' || u.Property_ID === filterProperty;
    const matchStatus = filterStatus === 'ALL' || u.Current_Status === filterStatus;
    return matchSearch && matchProp && matchStatus;
  });

  // Analytics
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.Current_Status === 'Occupied').length;
  const vacantUnits = units.filter(u => u.Current_Status === 'Vacant').length;
  const maintenanceUnits = units.filter(u => u.Current_Status === 'Maintenance').length;
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';
  const totalPotentialRent = units.reduce((sum, u) => sum + (u.Target_Rent || u.Monthly_Rent || 0), 0);

  const handleOpenAdd = () => {
    const nextId = 'UNIT-' + String(units.length + 1).padStart(3, '0');
    setFormData({
      Unit_ID: nextId,
      Property_ID: properties[0]?.Property_ID || '',
      Unit_Number: '',
      Floor_Plan: '1 Bedroom Suite',
      Monthly_Rent: 2200,
      Current_Status: 'Vacant',
      Bedrooms: 1,
      Bathrooms: 1,
      Square_Feet: 650,
      Notes: ''
    });
    setEditingUnit(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      Unit_ID: unit.Unit_ID,
      Property_ID: unit.Property_ID,
      Unit_Number: unit.Unit_Number_Name || unit.Unit_Number || '',
      Floor_Plan: unit.Unit_Type || unit.Floor_Plan || '',
      Monthly_Rent: unit.Target_Rent || unit.Monthly_Rent || 2000,
      Current_Status: unit.Current_Status,
      Bedrooms: unit.Bedrooms,
      Bathrooms: unit.Bathrooms,
      Square_Feet: unit.Square_Feet || 650,
      Notes: unit.Notes || ''
    });
    setShowAddModal(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Unit_Number.trim()) {
      onToast('Please provide a unit number/suite name', 'error');
      return;
    }

    const payload: Unit = {
      Unit_ID: formData.Unit_ID,
      Property_ID: formData.Property_ID,
      Unit_Number_Name: formData.Unit_Number,
      Unit_Number: formData.Unit_Number,
      Unit_Type: formData.Floor_Plan,
      Floor_Plan: formData.Floor_Plan,
      Target_Rent: formData.Monthly_Rent,
      Monthly_Rent: formData.Monthly_Rent,
      Current_Status: formData.Current_Status,
      Bedrooms: formData.Bedrooms,
      Bathrooms: formData.Bathrooms,
      Square_Feet: formData.Square_Feet,
      Notes: formData.Notes
    };

    if (editingUnit) {
      storage.updateUnit(payload, currentUser.Email);
      onToast(`Unit ${formData.Unit_Number} updated successfully`, 'success');
    } else {
      storage.addUnit(payload, currentUser.Email);
      onToast(`New unit ${formData.Unit_Number} added to inventory`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteUnitConfirm = () => {
    if (!deletingUnit) return;
    storage.deleteUnit(deletingUnit.Unit_ID, currentUser.Email);
    onToast(`Suite ${deletingUnit.Unit_Number_Name || deletingUnit.Unit_Number || deletingUnit.Unit_ID} deleted permanently`, 'info');
    setDeletingUnit(null);
  };

  const getStatusBadge = (status: Unit['Current_Status']) => {
    switch (status) {
      case 'Occupied':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Occupied</span>;
      case 'Vacant':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Vacant</span>;
      case 'Maintenance':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Maintenance</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DoorOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Units & Inventory Portfolio</h2>
              <p className="text-xs text-slate-500">Manage suite layouts, square footage, occupancy statuses, and market rental valuations</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Unit
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Units</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalUnits}</p>
          <span className="text-[10px] text-slate-500">Across {properties.length} properties</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Occupied</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{occupiedUnits}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{occupancyRate}% Occupancy Rate</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Vacant Ready</p>
          <p className="text-xl font-black text-amber-700 mt-1">{vacantUnits}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Ready for leasing</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Maintenance</p>
          <p className="text-xl font-black text-rose-700 mt-1">{maintenanceUnits}</p>
          <span className="text-[10px] text-rose-500">Turnover / Repairs</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Monthly Rent Roll</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{AccountingEngine.formatCurrency(totalPotentialRent)}</p>
          <span className="text-[10px] text-indigo-500">Potential Gross Rent</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by unit number, floor plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Properties</option>
            {properties.map(p => (
              <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUnits.map(unit => {
          const property = properties.find(p => p.Property_ID === unit.Property_ID);
          const activeLease = leases.find(l => l.Unit_ID === unit.Unit_ID && l.Status === 'Active');
          const tenant = activeLease ? tenants.find(t => t.Tenant_ID === activeLease.Tenant_ID) : null;

          return (
            <div
              key={unit.Unit_ID}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{unit.Unit_Number_Name || unit.Unit_Number || `Suite ${unit.Unit_ID}`}</span>
                    {getStatusBadge(unit.Current_Status)}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {property?.Property_Name || unit.Property_ID} ({property?.City}, {property?.Province})
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(unit)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Unit Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingUnit(unit)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Suite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Specs Badge Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">LAYOUT</span>
                  <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <Bed className="w-3.5 h-3.5 text-indigo-500" /> {unit.Bedrooms} Bed
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">BATH</span>
                  <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <Bath className="w-3.5 h-3.5 text-indigo-500" /> {unit.Bathrooms} Bath
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">SIZE</span>
                  <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> {unit.Square_Feet || 650} sqft
                  </span>
                </div>
              </div>

              {/* Rent & Tenant Section */}
              <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Monthly Rent:</span>
                  <span className="font-mono font-bold text-slate-900">{AccountingEngine.formatCurrency(unit.Target_Rent || unit.Monthly_Rent || 0)}/mo</span>
                </div>

                {tenant ? (
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-indigo-600">Current Occupant</p>
                      <p className="font-bold text-slate-900">{tenant.Full_Name}</p>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-700 font-bold">
                      Lease #{activeLease?.Lease_ID.slice(-4)}
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100 text-[11px] text-amber-700 font-medium text-center">
                    Available for immediate lease booking
                  </div>
                )}
              </div>

              {unit.Notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                  "{unit.Notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUnit ? `Edit Suite ${editingUnit.Unit_Number}` : 'Add New Inventory Unit'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Property *</label>
                  <select
                    value={formData.Property_ID}
                    onChange={(e) => setFormData({ ...formData, Property_ID: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    {properties.map(p => (
                      <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit / Suite Number *</label>
                  <input
                    type="text"
                    value={formData.Unit_Number}
                    onChange={(e) => setFormData({ ...formData, Unit_Number: e.target.value })}
                    placeholder="e.g. Suite 402"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.Bedrooms}
                    onChange={(e) => setFormData({ ...formData, Bedrooms: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={formData.Bathrooms}
                    onChange={(e) => setFormData({ ...formData, Bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Square Feet</label>
                  <input
                    type="number"
                    min="100"
                    step="10"
                    value={formData.Square_Feet}
                    onChange={(e) => setFormData({ ...formData, Square_Feet: parseInt(e.target.value) || 600 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Monthly Rent (CAD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={formData.Monthly_Rent}
                    onChange={(e) => setFormData({ ...formData, Monthly_Rent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Occupancy Status</label>
                  <select
                    value={formData.Current_Status}
                    onChange={(e) => setFormData({ ...formData, Current_Status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Floor Plan / Description</label>
                <input
                  type="text"
                  value={formData.Floor_Plan}
                  onChange={(e) => setFormData({ ...formData, Floor_Plan: e.target.value })}
                  placeholder="e.g. 1 Bed + Den Deluxe Balcony"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Amenities</label>
                <textarea
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="e.g. In-suite laundry, south-facing balcony, parking spot #14 included"
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
                  {editingUnit ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Unit Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUnit}
        title="Delete Unit / Suite"
        itemName={deletingUnit ? `${deletingUnit.Unit_Number_Name || deletingUnit.Unit_Number || deletingUnit.Unit_ID} (${deletingUnit.Unit_ID})` : ''}
        itemType="unit"
        warningMessage="Deleting this suite will remove it from property inventory and vacancy metrics."
        onConfirm={handleDeleteUnitConfirm}
        onCancel={() => setDeletingUnit(null)}
      />
    </div>
  );
};
