import React, { useState } from 'react';
import {
  Building2, DoorOpen, Plus, MapPin, DollarSign,
  UserCheck, ShieldCheck, Home, CheckCircle2, Edit3, Trash2,
  Car, Key, Check, X
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { Property, Unit, RegionalProvince, User, ParkingSpot } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface PropertiesViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({ currentUser, onToast }) => {
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const landlords = storage.getLandlords();
  const tenants = storage.getTenants();
  const leases = storage.getLeases();

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
    Province?: string;
    Postal_Code: string;
    Landlord_ID: string;
    Master_Rent_Amount: number;
    Has_Divisions: boolean;
    Division_Structure: 'None' | 'Main_And_Basement';
    Default_Main_Share_Pct: number;
    Default_Basement_Share_Pct: number;
    Division_Type: Property['Division_Type'];
    Parent_Property_ID?: string;
    Active: boolean;
    Parking_Spots: ParkingSpot[];
  }>({
    Property_Name: '',
    Address: '',
    City: 'Toronto',
    Postal_Code: 'M5V 2T6',
    Landlord_ID: landlords[0]?.Landlord_ID || '',
    Master_Rent_Amount: 4000,
    Has_Divisions: false,
    Division_Structure: 'None',
    Default_Main_Share_Pct: 60,
    Default_Basement_Share_Pct: 40,
    Division_Type: 'None',
    Parent_Property_ID: '',
    Active: true,
    Parking_Spots: []
  });

  // Unit Form State
  const [unitForm, setUnitForm] = useState<{
    Unit_ID: string;
    Property_ID: string;
    Unit_Number_Name: string;
    Unit_Type: string;
    Division_Level?: string;
    Utility_Share_Percentage?: number;
    Bedrooms: number;
    Bathrooms: number;
    Square_Feet: number;
    Target_Rent: number;
    Current_Status: Unit['Current_Status'];
  }>({
    Unit_ID: '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_Number_Name: '',
    Unit_Type: 'Apartment',
    Division_Level: 'None',
    Utility_Share_Percentage: 0,
    Bedrooms: 2,
    Bathrooms: 1,
    Square_Feet: 750,
    Target_Rent: 2200,
    Current_Status: 'Vacant'
  });

  const landlordName = (id?: string) => landlords.find(l => l.Landlord_ID === id)?.Full_Name || id || '—';
  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;

  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropForm({
      Property_Name: '',
      Address: '',
      City: 'Toronto',
      Postal_Code: 'M5V 2T6',
      Landlord_ID: landlords[0]?.Landlord_ID || '',
      Master_Rent_Amount: 4000,
      Has_Divisions: false,
      Division_Structure: 'None',
      Default_Main_Share_Pct: 60,
      Default_Basement_Share_Pct: 40,
      Division_Type: 'None',
      Parent_Property_ID: '',
      Active: true,
      Parking_Spots: [
        { Spot_ID: `PRK-${Date.now().toString(36).slice(-4)}-1`, Spot_Number_Name: 'Spot 1 - Driveway Left', Spot_Type: 'Driveway', Monthly_Fee: 0, Status: 'Available' },
        { Spot_ID: `PRK-${Date.now().toString(36).slice(-4)}-2`, Spot_Number_Name: 'Spot 2 - Driveway Right', Spot_Type: 'Driveway', Monthly_Fee: 0, Status: 'Available' }
      ]
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
      Postal_Code: p.Postal_Code,
      Landlord_ID: p.Landlord_ID || landlords[0]?.Landlord_ID || '',
      Master_Rent_Amount: p.Master_Rent_Amount,
      Has_Divisions: !!p.Has_Divisions,
      Division_Structure: p.Division_Structure || (p.Has_Divisions ? 'Main_And_Basement' : 'None'),
      Default_Main_Share_Pct: p.Default_Main_Share_Pct !== undefined ? p.Default_Main_Share_Pct : 60,
      Default_Basement_Share_Pct: p.Default_Basement_Share_Pct !== undefined ? p.Default_Basement_Share_Pct : 40,
      Division_Type: p.Division_Type || 'None',
      Parent_Property_ID: p.Parent_Property_ID || '',
      Active: p.Active ?? true,
      Parking_Spots: p.Parking_Spots ? p.Parking_Spots.map(s => ({ ...s })) : []
    });
    setShowPropertyModal(true);
  };

  const handleAddParkingSpotToPropForm = () => {
    const currentSpots = propForm.Parking_Spots || [];
    const nextNum = currentSpots.length + 1;
    const newSpot: ParkingSpot = {
      Spot_ID: `PRK-${Date.now().toString(36).slice(-4)}-${nextNum}`,
      Spot_Number_Name: `Spot ${nextNum}`,
      Spot_Type: 'Driveway',
      Monthly_Fee: 0,
      Status: 'Available'
    };
    setPropForm({
      ...propForm,
      Parking_Spots: [...currentSpots, newSpot]
    });
  };

  const handleQuickAddStandardSpots = (count: number) => {
    const currentSpots = propForm.Parking_Spots || [];
    const newSpots: ParkingSpot[] = [];
    for (let i = 1; i <= count; i++) {
      const spotNum = currentSpots.length + i;
      newSpots.push({
        Spot_ID: `PRK-${Date.now().toString(36).slice(-4)}-${spotNum}`,
        Spot_Number_Name: `Spot ${spotNum} - ${i % 2 === 1 ? 'Driveway' : 'Garage'}`,
        Spot_Type: i % 2 === 1 ? 'Driveway' : 'Garage',
        Monthly_Fee: 0,
        Status: 'Available'
      });
    }
    setPropForm({
      ...propForm,
      Parking_Spots: [...currentSpots, ...newSpots]
    });
  };

  const handleRemoveParkingSpotFromPropForm = (idx: number) => {
    const currentSpots = propForm.Parking_Spots || [];
    setPropForm({
      ...propForm,
      Parking_Spots: currentSpots.filter((_, i) => i !== idx)
    });
  };

  const handleUpdateParkingSpotInPropForm = (idx: number, patch: Partial<ParkingSpot>) => {
    const currentSpots = [...(propForm.Parking_Spots || [])];
    currentSpots[idx] = { ...currentSpots[idx], ...patch };
    setPropForm({
      ...propForm,
      Parking_Spots: currentSpots
    });
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPropId = editingProperty ? editingProperty.Property_ID : ('PROP-' + Date.now().toString(36).toUpperCase());

    const propertyPayload: Property = {
      Property_ID: targetPropId,
      Property_Name: propForm.Property_Name,
      Address: propForm.Address,
      City: propForm.City,
      Postal_Code: propForm.Postal_Code,
      Landlord_ID: propForm.Landlord_ID,
      Master_Rent_Amount: Number(propForm.Master_Rent_Amount) || 0,
      Has_Divisions: propForm.Has_Divisions,
      Division_Structure: propForm.Has_Divisions ? propForm.Division_Structure : 'None',
      Default_Main_Share_Pct: propForm.Has_Divisions ? Number(propForm.Default_Main_Share_Pct) : undefined,
      Default_Basement_Share_Pct: propForm.Has_Divisions ? Number(propForm.Default_Basement_Share_Pct) : undefined,
      Division_Type: propForm.Division_Type,
      Parent_Property_ID: propForm.Parent_Property_ID ? propForm.Parent_Property_ID : undefined,
      Active: propForm.Active,
      Parking_Spots: propForm.Parking_Spots,
      Created_At: editingProperty?.Created_At || new Date().toISOString().slice(0, 10)
    };

    if (editingProperty) {
      storage.updateProperty(propertyPayload, currentUser.Email);
      onToast(`Property "${propertyPayload.Property_Name}" updated successfully!`, 'success');
    } else {
      storage.addProperty(propertyPayload, currentUser.Email);
      onToast(`Property "${propertyPayload.Property_Name}" created!`, 'success');
    }

    // If configured as divided property (Main Floor & Basement), auto-provision or update sub-units
    if (propForm.Has_Divisions && propForm.Division_Structure === 'Main_And_Basement') {
      const existingUnits = storage.getUnits().filter(u => u.Property_ID === targetPropId);
      const mainUnit = existingUnits.find(u => u.Division_Level === 'Main Floor' || u.Unit_Number_Name?.toLowerCase().includes('main'));
      const bsmntUnit = existingUnits.find(u => u.Division_Level === 'Basement' || u.Unit_Number_Name?.toLowerCase().includes('basement'));

      const masterRent = Number(propForm.Master_Rent_Amount) || 4000;

      if (!mainUnit) {
        storage.addUnit({
          Unit_ID: 'UNIT-' + Date.now().toString(36).toUpperCase() + '-M',
          Property_ID: targetPropId,
          Unit_Number_Name: 'Main Floor',
          Unit_Type: 'Main Floor Suite',
          Division_Level: 'Main Floor',
          Target_Rent: Math.round(masterRent * 0.6),
          Current_Status: 'Vacant',
          Bedrooms: 2,
          Bathrooms: 1,
          Square_Feet: 1200
        }, currentUser.Email);
      } else {
        storage.updateUnit({
          ...mainUnit,
          Division_Level: 'Main Floor'
        }, currentUser.Email);
      }

      if (!bsmntUnit) {
        storage.addUnit({
          Unit_ID: 'UNIT-' + Date.now().toString(36).toUpperCase() + '-B',
          Property_ID: targetPropId,
          Unit_Number_Name: 'Basement Suite',
          Unit_Type: 'Basement Suite',
          Division_Level: 'Basement',
          Target_Rent: Math.round(masterRent * 0.4),
          Current_Status: 'Vacant',
          Bedrooms: 1,
          Bathrooms: 1,
          Square_Feet: 800
        }, currentUser.Email);
      } else {
        storage.updateUnit({
          ...bsmntUnit,
          Division_Level: 'Basement'
        }, currentUser.Email);
      }
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
      Division_Level: 'None',
      Utility_Share_Percentage: 0,
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
      Division_Level: u.Division_Level || 'None',
      Utility_Share_Percentage: u.Utility_Share_Percentage || 0,
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
        Division_Level: unitForm.Division_Level === 'None' ? undefined : (unitForm.Division_Level as any),
        Utility_Share_Percentage: Number(unitForm.Utility_Share_Percentage) || undefined,
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
        Division_Level: unitForm.Division_Level === 'None' ? undefined : (unitForm.Division_Level as any),
        Utility_Share_Percentage: Number(unitForm.Utility_Share_Percentage) || undefined,
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
                        Active
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

                  {/* Sub-Unit Division Breakdown (Main Floor & Basement) */}
                  {p.Has_Divisions && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          <span>🏢 Single Property Division</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          1 Master Rent: {AccountingEngine.formatCurrency(p.Master_Rent_Amount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {/* Main Floor sub-unit */}
                        {(() => {
                          const mUnit = propUnits.find(u => u.Division_Level === 'Main Floor' || u.Unit_Number_Name?.toLowerCase().includes('main'));
                          const mTenant = mUnit ? tenants.find(t => t.Current_Unit_ID === mUnit.Unit_ID || (t.Current_Property_ID === p.Property_ID && t.Floor_Division === 'Main Floor')) : null;
                          return (
                            <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-center justify-between font-bold text-blue-900 text-[11px]">
                                <span>🏠 Main Floor</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${mTenant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {mTenant ? 'Occupied' : 'Vacant'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-600 mt-1 truncate">
                                Tenant: <span className="font-semibold text-slate-900">{mTenant ? mTenant.Full_Name : 'No active tenant'}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Basement sub-unit */}
                        {(() => {
                          const bUnit = propUnits.find(u => u.Division_Level === 'Basement' || u.Unit_Number_Name?.toLowerCase().includes('basement'));
                          const bTenant = bUnit ? tenants.find(t => t.Current_Unit_ID === bUnit.Unit_ID || (t.Current_Property_ID === p.Property_ID && t.Floor_Division === 'Basement')) : null;
                          return (
                            <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                              <div className="flex items-center justify-between font-bold text-amber-900 text-[11px]">
                                <span>🏡 Basement</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${bTenant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {bTenant ? 'Occupied' : 'Vacant'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-600 mt-1 truncate">
                                Tenant: <span className="font-semibold text-slate-900">{bTenant ? bTenant.Full_Name : 'No active tenant'}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        Expenses, repairs & utility bills are allocated manually to each floor as incurred.
                      </p>
                    </div>
                  )}

                  {/* Property Level Parking Overview */}
                  {p.Parking_Spots && p.Parking_Spots.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-950 flex items-center gap-1.5 text-[11px]">
                          <Car className="w-3.5 h-3.5 text-blue-600" />
                          Parking ({p.Parking_Spots.filter(s => s.Status === 'Assigned').length}/{p.Parking_Spots.length} Assigned)
                        </span>
                        <span className="text-[10px] text-blue-700 font-semibold">
                          {p.Parking_Spots.filter(s => s.Status === 'Available').length} Available
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.Parking_Spots.map(s => {
                          const t = tenants.find(ten => ten.Tenant_ID === s.Assigned_Tenant_ID);
                          const isAssigned = s.Status === 'Assigned';
                          return (
                            <span
                              key={s.Spot_ID}
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${
                                isAssigned ? 'bg-white border-blue-200 text-blue-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              {s.Spot_Number_Name}
                              {isAssigned && t && <span className="text-blue-700 font-bold">({t.Full_Name.split(' ')[0]})</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                  <th className="py-3 px-4">Floor Division</th>
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
                    <td className="py-3 px-4">
                      {u.Division_Level && u.Division_Level !== 'None' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.Division_Level === 'Main Floor' ? 'bg-blue-100 text-blue-800' :
                            u.Division_Level === 'Basement' ? 'bg-amber-100 text-amber-800' :
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {u.Division_Level === 'Main Floor' ? '🏠 Main Floor' :
                             u.Division_Level === 'Basement' ? '🏡 Basement' : u.Division_Level}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Standard / Whole</span>
                      )}
                    </td>
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white z-10">
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Master Rent ($/mo)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={propForm.Master_Rent_Amount}
                    onChange={(e) => setPropForm({ ...propForm, Master_Rent_Amount: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono font-semibold"
                  />
                  <span className="text-[10px] text-slate-500">Rent paid on full property</span>
                </div>
              </div>

              {/* Single Property with Sub-Unit Division (Main Floor & Basement) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Property Structure & Floor Division
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPropForm({ ...propForm, Has_Divisions: false, Division_Structure: 'None' })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        !propForm.Has_Divisions
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">🏢 Single Whole Unit</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Standard undivided building</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPropForm({
                        ...propForm,
                        Has_Divisions: true,
                        Division_Structure: 'Main_And_Basement',
                        Default_Main_Share_Pct: propForm.Default_Main_Share_Pct || 60,
                        Default_Basement_Share_Pct: propForm.Default_Basement_Share_Pct || 40
                      })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        propForm.Has_Divisions
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-indigo-700">🏠 Main Floor & 🏡 Basement</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">1 Property for rent, divided for expenses & tenants</div>
                    </button>
                  </div>
                </div>

                {propForm.Has_Divisions && (
                  <div className="pt-2 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                    <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <span>🏢 Unified Single Property Architecture</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        Rent is paid on the single full property ({AccountingEngine.formatCurrency(propForm.Master_Rent_Amount || 0)} master rent). Saving will maintain the <strong>Main Floor</strong> and <strong>Basement Suite</strong> sub-units for assigning tenants.
                      </p>
                      <div className="p-2 bg-white rounded-lg border border-indigo-100 text-[11px] text-slate-600 flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">✓ Manual Expense Allocation:</span>
                        <span>Utility bills, repairs, and expenses are manually allocated to Main Floor and Basement as incurred without any fixed ratio.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Property-Level Parking Spots Management */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Property Parking Spots</h4>
                      <p className="text-[10px] text-slate-500">
                        Configured at property level (cannot be split by unit); assignable to tenants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddParkingSpotToPropForm}
                      className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Add Spot
                    </button>
                  </div>
                </div>

                {(!propForm.Parking_Spots || propForm.Parking_Spots.length === 0) ? (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-500">No parking spots configured for this property.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAddStandardSpots(2)}
                        className="px-2.5 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                      >
                        + Add 2 Spots (Driveway & Garage)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAddStandardSpots(4)}
                        className="px-2.5 py-1 text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                      >
                        + Add 4 Spots
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {propForm.Parking_Spots.map((spot, idx) => (
                      <div key={spot.Spot_ID || idx} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                            <input
                              type="text"
                              value={spot.Spot_Number_Name}
                              onChange={(e) => handleUpdateParkingSpotInPropForm(idx, { Spot_Number_Name: e.target.value })}
                              placeholder="e.g. Spot 1 - Driveway Left"
                              className="text-xs font-bold text-slate-900 border-b border-slate-200 focus:border-blue-600 outline-none flex-1 py-0.5"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParkingSpotFromPropForm(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove Spot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Type</label>
                            <select
                              value={spot.Spot_Type || 'Driveway'}
                              onChange={(e) => handleUpdateParkingSpotInPropForm(idx, { Spot_Type: e.target.value as any })}
                              className="w-full text-xs rounded-lg border border-slate-200 p-1.5 outline-none bg-white"
                            >
                              <option value="Driveway">Driveway</option>
                              <option value="Garage">Garage</option>
                              <option value="Underground">Underground</option>
                              <option value="Covered">Covered</option>
                              <option value="Outdoor Surface">Outdoor Surface</option>
                              <option value="Street Permit">Street Permit</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Fee ($/mo)</label>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={spot.Monthly_Fee || 0}
                              onChange={(e) => handleUpdateParkingSpotInPropForm(idx, { Monthly_Fee: Number(e.target.value) })}
                              className="w-full text-xs rounded-lg border border-slate-200 p-1.5 outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Status</label>
                            <select
                              value={spot.Status}
                              onChange={(e) => {
                                const newStatus = e.target.value as ParkingSpot['Status'];
                                handleUpdateParkingSpotInPropForm(idx, {
                                  Status: newStatus,
                                  Assigned_Tenant_ID: newStatus === 'Available' ? undefined : spot.Assigned_Tenant_ID
                                });
                              }}
                              className="w-full text-xs rounded-lg border border-slate-200 p-1.5 outline-none bg-white font-semibold"
                            >
                              <option value="Available">Available</option>
                              <option value="Assigned">Assigned</option>
                              <option value="Reserved">Reserved</option>
                              <option value="Maintenance">Maintenance</option>
                            </select>
                          </div>
                        </div>

                        {spot.Status === 'Assigned' && (
                          <div className="pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-2 bg-blue-50/40 p-2 rounded-lg">
                            <div>
                              <label className="text-[10px] text-blue-900 block mb-0.5 font-semibold">Assigned Tenant</label>
                              <select
                                value={spot.Assigned_Tenant_ID || ''}
                                onChange={(e) => handleUpdateParkingSpotInPropForm(idx, { Assigned_Tenant_ID: e.target.value || undefined })}
                                className="w-full text-[11px] rounded-md border border-blue-200 p-1 bg-white outline-none"
                              >
                                <option value="">Select tenant...</option>
                                {tenants.map(t => (
                                  <option key={t.Tenant_ID} value={t.Tenant_ID}>{t.Full_Name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-blue-900 block mb-0.5 font-semibold">Vehicle Plate (Optional)</label>
                              <input
                                type="text"
                                value={spot.Vehicle_Plate || ''}
                                onChange={(e) => handleUpdateParkingSpotInPropForm(idx, { Vehicle_Plate: e.target.value.toUpperCase() })}
                                placeholder="e.g. CXYZ-789"
                                className="w-full text-[11px] rounded-md border border-blue-200 p-1 bg-white outline-none font-mono uppercase"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white z-10">
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
                    <option key={p.Property_ID} value={p.Property_ID}>
                      {p.Property_Name} {p.Has_Divisions ? '(Divided Main & Basement)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit / Suite Number or Title</label>
                <input
                  type="text"
                  required
                  value={unitForm.Unit_Number_Name}
                  onChange={(e) => setUnitForm({ ...unitForm, Unit_Number_Name: e.target.value })}
                  placeholder="e.g. Main Floor or Basement Suite"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Division / Floor Level</label>
                  <select
                    value={unitForm.Division_Level || 'None'}
                    onChange={(e) => {
                      setUnitForm({
                        ...unitForm,
                        Division_Level: e.target.value
                      });
                    }}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="None">None (Whole Property / Standard Unit)</option>
                    <option value="Main Floor">🏠 Main Floor Division</option>
                    <option value="Basement">🏡 Basement Suite Division</option>
                    <option value="Upper Floor">🔼 Upper Floor Division</option>
                    <option value="Laneway House">🏡 Laneway / Carriage House</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Main Floor and Basement suites are maintained for separate leasing. Utility bills, repairs, and expenses are manually allocated without fixed percentage ratios.
                </p>
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
