import React, { useState } from 'react';
import {
  Building2, DoorOpen, Plus, MapPin, DollarSign,
  UserCheck, ShieldCheck, Home, CheckCircle2, Edit3, Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { Property, Unit, RegionalProvince, User } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PropertiesViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({ currentUser, onToast }) => {
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const landlords = storage.getLandlords();

  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'UNITS'>('PROPERTIES');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Delete State
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // Property Form State
  const [propForm, setPropForm] = useState<{
    Property_ID?: string;
    Property_Name: string;
    Address: string;
    City: string;
    Province: RegionalProvince;
    Postal_Code: string;
    Landlord_ID: string;
    Master_Rent_Amount: number;
    Division_Type: Property['Division_Type'];
    Parent_Property_ID?: string;
    Active: boolean;
  }>({
    Property_Name: '',
    Address: '',
    City: 'Toronto',
    Province: 'ON',
    Postal_Code: 'M5V 2T6',
    Landlord_ID: landlords[0]?.Landlord_ID || '',
    Master_Rent_Amount: 4500,
    Division_Type: 'None',
    Parent_Property_ID: '',
    Active: true
  });

  // Unit Form State
  const [unitForm, setUnitForm] = useState({
    Unit_ID: '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_Number_Name: '',
    Unit_Type: 'Apartment',
    Bedrooms: 2,
    Bathrooms: 1,
    Square_Feet: 750,
    Target_Rent: 2200,
    Current_Status: 'Vacant' as Unit['Current_Status']
  });

  const landlordName = (id?: string) => landlords.find(l => l.Landlord_ID === id)?.Full_Name || id || '—';
  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;

  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropForm({
      Property_Name: '',
      Address: '',
      City: 'Toronto',
      Province: 'ON',
      Postal_Code: 'M5V 2T6',
      Landlord_ID: landlords[0]?.Landlord_ID || '',
      Master_Rent_Amount: 4500,
      Division_Type: 'None',
      Parent_Property_ID: '',
      Active: true
    });
    setShowPropertyModal(true);
  };

  const handleOpenEditProperty = (p: Property) => {
    setEditingProperty(p);
    setPropForm({
      Property_ID: p.Property_ID,
      Property_Name: p.Property_Name,
      Address: p.Address,
      City: p.City,
      Province: p.Province,
      Postal_Code: p.Postal_Code,
      Landlord_ID: p.Landlord_ID || landlords[0]?.Landlord_ID || '',
      Master_Rent_Amount: p.Master_Rent_Amount,
      Division_Type: p.Division_Type || 'None',
      Parent_Property_ID: p.Parent_Property_ID || '',
      Active: p.Active ?? true
    });
    setShowPropertyModal(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      const updated: Property = {
        ...editingProperty,
        Property_Name: propForm.Property_Name,
        Address: propForm.Address,
        City: propForm.City,
        Province: propForm.Province,
        Postal_Code: propForm.Postal_Code,
        Landlord_ID: propForm.Landlord_ID,
        Master_Rent_Amount: Number(propForm.Master_Rent_Amount) || 0,
        Division_Type: propForm.Division_Type,
        Parent_Property_ID: propForm.Parent_Property_ID ? propForm.Parent_Property_ID : undefined,
        Active: propForm.Active
      };
      storage.updateProperty(updated, currentUser.Email);
      onToast(`Property "${updated.Property_Name}" updated successfully!`, 'success');
    } else {
      const newId = 'PROP-' + Date.now().toString(36).toUpperCase();
      const newProp: Property = {
        Property_ID: newId,
        Property_Name: propForm.Property_Name,
        Address: propForm.Address,
        City: propForm.City,
        Province: propForm.Province,
        Postal_Code: propForm.Postal_Code,
        Landlord_ID: propForm.Landlord_ID,
        Master_Rent_Amount: Number(propForm.Master_Rent_Amount) || 0,
        Division_Type: propForm.Division_Type,
        Parent_Property_ID: propForm.Parent_Property_ID ? propForm.Parent_Property_ID : undefined,
        Active: propForm.Active,
        Created_At: new Date().toISOString().slice(0, 10)
      };
      storage.addProperty(newProp, currentUser.Email);
      onToast(`Property "${newProp.Property_Name}" created!`, 'success');
    }
    setShowPropertyModal(false);
  };

  const handleDeletePropertyConfirm = () => {
    if (!deletingProperty) return;
    storage.deleteProperty(deletingProperty.Property_ID, currentUser.Email);
    onToast(`Property "${deletingProperty.Property_Name}" deleted permanently`, 'info');
    setDeletingProperty(null);
  };

  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({
      Unit_ID: 'UNIT-' + String(units.length + 1).padStart(3, '0'),
      Property_ID: properties[0]?.Property_ID || '',
      Unit_Number_Name: '',
      Unit_Type: 'Apartment',
      Bedrooms: 2,
      Bathrooms: 1,
      Square_Feet: 750,
      Target_Rent: 2200,
      Current_Status: 'Vacant'
    });
    setShowUnitModal(true);
  };

  const handleOpenEditUnit = (u: Unit) => {
    setEditingUnit(u);
    setUnitForm({
      Unit_ID: u.Unit_ID,
      Property_ID: u.Property_ID,
      Unit_Number_Name: u.Unit_Number_Name || u.Unit_Number || '',
      Unit_Type: u.Unit_Type || u.Floor_Plan || 'Apartment',
      Bedrooms: u.Bedrooms || 1,
      Bathrooms: u.Bathrooms || 1,
      Square_Feet: u.Square_Feet || 650,
      Target_Rent: u.Target_Rent || u.Monthly_Rent || 2000,
      Current_Status: u.Current_Status || 'Vacant'
    });
    setShowUnitModal(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnit) {
      const updated: Unit = {
        ...editingUnit,
        Property_ID: unitForm.Property_ID,
        Unit_Number_Name: unitForm.Unit_Number_Name,
        Unit_Number: unitForm.Unit_Number_Name,
        Unit_Type: unitForm.Unit_Type,
        Bedrooms: Number(unitForm.Bedrooms),
        Bathrooms: Number(unitForm.Bathrooms),
        Square_Feet: Number(unitForm.Square_Feet),
        Target_Rent: Number(unitForm.Target_Rent),
        Current_Status: unitForm.Current_Status
      };
      storage.updateUnit(updated, currentUser.Email);
      onToast(`Unit "${updated.Unit_Number_Name}" updated!`, 'success');
    } else {
      const newId = 'UNIT-' + Date.now().toString(36).toUpperCase();
      const newUnit: Unit = {
        Unit_ID: newId,
        Property_ID: unitForm.Property_ID,
        Unit_Number_Name: unitForm.Unit_Number_Name,
        Unit_Type: unitForm.Unit_Type,
        Bedrooms: Number(unitForm.Bedrooms),
        Bathrooms: Number(unitForm.Bathrooms),
        Square_Feet: Number(unitForm.Square_Feet),
        Target_Rent: Number(unitForm.Target_Rent),
        Current_Status: unitForm.Current_Status,
        Created_At: new Date().toISOString().slice(0, 10)
      };
      storage.addUnit(newUnit, currentUser.Email);
      onToast(`Unit "${newUnit.Unit_Number_Name}" added!`, 'success');
    }
    setShowUnitModal(false);
  };

  const handleDeleteUnitConfirm = () => {
    if (!deletingUnit) return;
    storage.deleteUnit(deletingUnit.Unit_ID, currentUser.Email);
    onToast(`Unit "${deletingUnit.Unit_Number_Name || deletingUnit.Unit_ID}" deleted permanently`, 'info');
    setDeletingUnit(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab('PROPERTIES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PROPERTIES' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Properties ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab('UNITS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'UNITS' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Units / Suites ({units.length})
          </button>
        </div>

        <div>
          {activeTab === 'PROPERTIES' ? (
            <button
              onClick={handleOpenAddProperty}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Property
            </button>
          ) : (
            <button
              onClick={handleOpenAddUnit}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Unit / Suite
            </button>
          )}
        </div>
      </div>

      {/* 1. PROPERTIES TAB */}
      {activeTab === 'PROPERTIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => {
            const propUnits = units.filter(u => u.Property_ID === p.Property_ID);
            const occupiedUnits = propUnits.filter(u => u.Current_Status === 'Occupied');
            const occRate = propUnits.length > 0 ? Math.round((occupiedUnits.length / propUnits.length) * 100) : 0;

            return (
              <div key={p.Property_ID} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {p.Division_Type && p.Division_Type !== 'None' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.Division_Type === 'Parent_Building'
                            ? 'bg-purple-100 text-purple-800'
                            : p.Division_Type === 'Main_Floor'
                            ? 'bg-blue-100 text-blue-800'
                            : p.Division_Type === 'Basement_Suite'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {p.Division_Type === 'Parent_Building' ? '🏢 Parent Building' :
                           p.Division_Type === 'Main_Floor' ? '🏠 Main Floor' :
                           p.Division_Type === 'Basement_Suite' ? '🏡 Basement Suite' :
                           p.Division_Type === 'Upper_Floor' ? '🔼 Upper Floor' :
                           p.Division_Type === 'Laneway_House' ? '🏡 Laneway House' : 'Divided Unit'}
                        </span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {p.Province} · Active
                      </span>
                      <button
                        onClick={() => handleOpenEditProperty(p)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Property"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingProperty(p)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.Property_Name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.Address}, {p.City} {p.Postal_Code}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Owner / Landlord:</span>
                      <span className="font-semibold text-slate-900">{landlordName(p.Landlord_ID)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Master Lease Rent:</span>
                      <span className="font-mono font-semibold text-slate-900">{AccountingEngine.formatCurrency(p.Master_Rent_Amount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Occupancy:</span>
                      <span className="font-bold text-indigo-700">{occRate}% ({occupiedUnits.length}/{propUnits.length} Units)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${occRate}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50 text-slate-400">
                    <span>ID: {p.Property_ID}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditProperty(p)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Edit
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => setDeletingProperty(p)}
                        className="text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. UNITS TAB */}
      {activeTab === 'UNITS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Unit ID</th>
                  <th className="py-3 px-4">Suite / Name</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Target Rent ($)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map(u => (
                  <tr key={u.Unit_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{u.Unit_ID}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{u.Unit_Number_Name || u.Unit_Number}</td>
                    <td className="py-3 px-4 text-slate-700">{propertyName(u.Property_ID)}</td>
                    <td className="py-3 px-4 text-slate-600">{u.Bedrooms} Bed · {u.Bathrooms} Bath ({u.Square_Feet} sqft)</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {AccountingEngine.formatCurrency(u.Target_Rent || u.Monthly_Rent || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.Current_Status === 'Occupied' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.Current_Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditUnit(u)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Unit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUnit(u)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProperty ? `Edit Property: ${editingProperty.Property_Name}` : 'Register Property'}
              </h3>
              <button onClick={() => setShowPropertyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveProperty} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Property Name / Building Title</label>
                <input
                  type="text"
                  required
                  value={propForm.Property_Name}
                  onChange={(e) => setPropForm({ ...propForm, Property_Name: e.target.value })}
                  placeholder="e.g. Maple Leaf Executive Residences"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={propForm.Address}
                  onChange={(e) => setPropForm({ ...propForm, Address: e.target.value })}
                  placeholder="e.g. 100 King Street West"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={propForm.City}
                    onChange={(e) => setPropForm({ ...propForm, City: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Province</label>
                  <select
                    value={propForm.Province}
                    onChange={(e) => setPropForm({ ...propForm, Province: e.target.value as RegionalProvince })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="ON">ON (13% HST)</option>
                    <option value="BC">BC (5% GST + 7% PST)</option>
                    <option value="QC">QC (5% GST + 9.975% QST)</option>
                    <option value="AB">AB (5% GST)</option>
                    <option value="MB">MB (5% GST + 7% PST)</option>
                    <option value="SK">SK (5% GST + 6% PST)</option>
                    <option value="NS">NS (15% HST)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={propForm.Postal_Code}
                    onChange={(e) => setPropForm({ ...propForm, Postal_Code: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Landlord / Owner</label>
                  <select
                    value={propForm.Landlord_ID}
                    onChange={(e) => setPropForm({ ...propForm, Landlord_ID: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    {landlords.map(l => (
                      <option key={l.Landlord_ID} value={l.Landlord_ID}>{l.Full_Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Master Rent ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={propForm.Master_Rent_Amount}
                    onChange={(e) => setPropForm({ ...propForm, Master_Rent_Amount: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Property Division / Tagging Configuration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Property Division Tag (Basement / Main Floor / Multi-Unit)
                  </label>
                  <select
                    value={propForm.Division_Type || 'None'}
                    onChange={(e) => setPropForm({ ...propForm, Division_Type: e.target.value as any })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="None">Standalone Single Property (No Division)</option>
                    <option value="Parent_Building">🏢 Master Parent Building (Has divided sub-properties)</option>
                    <option value="Main_Floor">🏠 Main Floor Division</option>
                    <option value="Basement_Suite">🏡 Basement Suite Division</option>
                    <option value="Upper_Floor">🔼 Upper Floor Division</option>
                    <option value="Laneway_House">🏡 Laneway / Carriage House</option>
                    <option value="Custom_Division">🧩 Custom Tagged Division</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Allows unified single utility invoices to be automatically apportioned between Main Floor & Basement or sub-divisions.
                  </p>
                </div>

                {propForm.Division_Type && propForm.Division_Type !== 'None' && propForm.Division_Type !== 'Parent_Building' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Link to Master Parent Property (Optional)
                    </label>
                    <select
                      value={propForm.Parent_Property_ID || ''}
                      onChange={(e) => setPropForm({ ...propForm, Parent_Property_ID: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600 bg-white"
                    >
                      <option value="">-- Select Parent Building or Standalone Parent --</option>
                      {properties
                        .filter(p => !editingProperty || p.Property_ID !== editingProperty.Property_ID)
                        .map(p => (
                          <option key={p.Property_ID} value={p.Property_ID}>
                            {p.Property_Name} ({p.Address})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {editingProperty ? 'Save Changes' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUnit ? `Edit Unit: ${editingUnit.Unit_Number_Name || editingUnit.Unit_ID}` : 'Add Unit / Suite'}
              </h3>
              <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveUnit} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Belongs to Property</label>
                <select
                  value={unitForm.Property_ID}
                  onChange={(e) => setUnitForm({ ...unitForm, Property_ID: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                >
                  {properties.map(p => (
                    <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit / Suite Number</label>
                <input
                  type="text"
                  required
                  value={unitForm.Unit_Number_Name}
                  onChange={(e) => setUnitForm({ ...unitForm, Unit_Number_Name: e.target.value })}
                  placeholder="e.g. Suite 402 or Unit B"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={unitForm.Bedrooms}
                    onChange={(e) => setUnitForm({ ...unitForm, Bedrooms: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={unitForm.Bathrooms}
                    onChange={(e) => setUnitForm({ ...unitForm, Bathrooms: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Rent ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitForm.Target_Rent}
                    onChange={(e) => setUnitForm({ ...unitForm, Target_Rent: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Current Status</label>
                <select
                  value={unitForm.Current_Status}
                  onChange={(e) => setUnitForm({ ...unitForm, Current_Status: e.target.value as Unit['Current_Status'] })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  {editingUnit ? 'Save Changes' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Property Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingProperty}
        title="Delete Property"
        itemName={deletingProperty ? `${deletingProperty.Property_Name} (${deletingProperty.Property_ID})` : ''}
        itemType="property"
        warningMessage="Deleting this property will also affect any associated unit references and historical reports."
        onConfirm={handleDeletePropertyConfirm}
        onCancel={() => setDeletingProperty(null)}
      />

      {/* Confirm Delete Unit Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUnit}
        title="Delete Unit"
        itemName={deletingUnit ? `${deletingUnit.Unit_Number_Name || deletingUnit.Unit_ID} (${deletingUnit.Unit_ID})` : ''}
        itemType="unit"
        warningMessage="Deleting this suite will remove it from the inventory roll and vacancy dashboard."
        onConfirm={handleDeleteUnitConfirm}
        onCancel={() => setDeletingUnit(null)}
      />
    </div>
  );
};
