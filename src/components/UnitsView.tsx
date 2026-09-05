import React, { useState } from 'react';
import {
  DoorOpen, Plus, Search, Filter, Edit3, CheckCircle2,
  AlertCircle, Building2, DollarSign, Home, Bed, Bath,
  Layers, ChevronRight, X, Sparkles, Check, Trash2, Split, Users,
  Car, Utensils, Armchair, ShieldCheck, Key, RefreshCw, UserCheck
} from 'lucide-react';
import { storage } from '../services/storage';
import { Unit, Property, User, ParkingSpot, Lease, Tenant } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getUnitOccupancySummary, getPropertyParkingAvailability } from '../utils/roomAllocation';

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
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // Parking Assignment Modal state
  const [parkingModalOpen, setParkingModalOpen] = useState(false);
  const [parkingTargetUnit, setParkingTargetUnit] = useState<Unit | null>(null);
  const [assignSpotId, setAssignSpotId] = useState('');
  const [assignTenantId, setAssignTenantId] = useState('');
  const [assignPlate, setAssignPlate] = useState('');

  // Simplified Unit Form State (Rooms, Washrooms, Baths, Kitchen, Kitchen Type, Den)
  const [formData, setFormData] = useState<{
    Unit_ID: string;
    Property_ID: string;
    Unit_Number: string;
    Floor_Plan: string;
    Division_Level: string;
    Monthly_Rent: number;
    Current_Status: 'Vacant' | 'Occupied' | 'Maintenance' | 'Inactive';
    Bedrooms: number;
    Bathrooms: number;
    Square_Feet: number;
    Kitchens: number;
    Kitchen_Type: 'Full Kitchen' | 'Kitchenette' | 'Shared Kitchen' | 'None';
    Has_Den: boolean;
    Dens_Count: number;
    Den_Details: string;
    Notes: string;
  }>({
    Unit_ID: '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_Number: '',
    Floor_Plan: 'Multi-Space Suite',
    Division_Level: 'None',
    Monthly_Rent: 3900,
    Current_Status: 'Vacant',
    Bedrooms: 3,
    Bathrooms: 2,
    Square_Feet: 1200,
    Kitchens: 1,
    Kitchen_Type: 'Full Kitchen',
    Has_Den: true,
    Dens_Count: 1,
    Den_Details: 'Common Study & Work Lounge',
    Notes: 'Main floor segment with 3 available rooms, washrooms, kitchen, and den.'
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
    const matchDivision = filterDivision === 'ALL' ||
      (filterDivision === 'NONE' ? (!u.Division_Level || u.Division_Level === 'None') : u.Division_Level === filterDivision);
    return matchSearch && matchProp && matchStatus && matchDivision;
  });

  // Calculate dynamic occupancy across units
  let totalCapacityAll = 0;
  let totalOccupiedAll = 0;
  units.forEach(u => {
    const occ = getUnitOccupancySummary(u, leases, tenants);
    totalCapacityAll += occ.totalCapacity;
    totalOccupiedAll += occ.totalOccupied;
  });
  const totalVacantAll = Math.max(0, totalCapacityAll - totalOccupiedAll);
  const occupancyPercentage = totalCapacityAll > 0 ? ((totalOccupiedAll / totalCapacityAll) * 100).toFixed(1) : '0';

  const handleOpenAdd = () => {
    const nextId = 'UNIT-' + String(units.length + 1).padStart(3, '0');
    setFormData({
      Unit_ID: nextId,
      Property_ID: properties[0]?.Property_ID || '',
      Unit_Number: 'Main Floor (3 Rooms)',
      Floor_Plan: '3 Bed + Den Suite',
      Division_Level: 'Main Floor',
      Monthly_Rent: 3900,
      Current_Status: 'Vacant',
      Bedrooms: 3,
      Bathrooms: 2,
      Square_Feet: 1200,
      Kitchens: 1,
      Kitchen_Type: 'Full Kitchen',
      Has_Den: true,
      Dens_Count: 1,
      Den_Details: 'Common Study & Work Lounge',
      Notes: '3 available bedrooms. Rent is assigned per tenant during lease creation.'
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
      Floor_Plan: unit.Unit_Type || unit.Floor_Plan || 'Standard Suite',
      Division_Level: unit.Division_Level || 'None',
      Monthly_Rent: unit.Target_Rent || unit.Monthly_Rent || 0,
      Current_Status: unit.Current_Status,
      Bedrooms: unit.Bedrooms !== undefined ? unit.Bedrooms : 3,
      Bathrooms: unit.Bathrooms !== undefined ? unit.Bathrooms : 1,
      Square_Feet: unit.Square_Feet || 800,
      Kitchens: unit.Kitchens !== undefined ? unit.Kitchens : 1,
      Kitchen_Type: unit.Kitchen_Type || 'Full Kitchen',
      Has_Den: !!unit.Has_Den,
      Dens_Count: unit.Dens_Count || (unit.Has_Den ? 1 : 0),
      Den_Details: unit.Den_Details || '',
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
      ...(editingUnit || {}),
      Unit_ID: formData.Unit_ID,
      Property_ID: formData.Property_ID,
      Unit_Number_Name: formData.Unit_Number,
      Unit_Number: formData.Unit_Number,
      Unit_Type: formData.Floor_Plan,
      Floor_Plan: formData.Floor_Plan,
      Division_Level: formData.Division_Level === 'None' ? undefined : (formData.Division_Level as any),
      Target_Rent: formData.Monthly_Rent,
      Monthly_Rent: formData.Monthly_Rent,
      Current_Status: formData.Current_Status,
      Bedrooms: formData.Bedrooms,
      Bathrooms: formData.Bathrooms,
      Square_Feet: formData.Square_Feet,
      Kitchens: formData.Kitchens,
      Kitchen_Type: formData.Kitchen_Type,
      Has_Den: formData.Has_Den,
      Dens_Count: formData.Has_Den ? (formData.Dens_Count || 1) : 0,
      Den_Details: formData.Has_Den ? formData.Den_Details : undefined,
      Notes: formData.Notes,
      Allow_Full_Room_Lease: true
    };

    if (editingUnit) {
      storage.updateUnit(payload, currentUser.Email);
      onToast(`Unit ${formData.Unit_Number} updated successfully`, 'success');
    } else {
      storage.addUnit(payload, currentUser.Email);
      onToast(`New unit ${formData.Unit_Number} added to inventory with ${formData.Bedrooms} available rooms`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteUnitConfirm = () => {
    if (!deletingUnit) return;
    storage.deleteUnit(deletingUnit.Unit_ID, currentUser.Email);
    onToast(`Suite ${deletingUnit.Unit_Number_Name || deletingUnit.Unit_Number || deletingUnit.Unit_ID} deleted permanently`, 'info');
    setDeletingUnit(null);
  };

  // Property Parking Quick Assignment Handler
  const handleOpenAssignParking = (unit: Unit) => {
    setParkingTargetUnit(unit);
    const prop = properties.find(p => p.Property_ID === unit.Property_ID);
    const firstAvail = prop?.Parking_Spots?.find(s => s.Status === 'Available');
    setAssignSpotId(firstAvail?.Spot_ID || (prop?.Parking_Spots?.[0]?.Spot_ID || ''));

    // Find tenants residing in this unit/property
    const unitTenants = tenants.filter(t =>
      t.Current_Unit_ID === unit.Unit_ID ||
      t.Current_Property_ID === unit.Property_ID
    );
    setAssignTenantId(unitTenants[0]?.Tenant_ID || '');
    setAssignPlate('');
    setParkingModalOpen(true);
  };

  const handleConfirmAssignParking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parkingTargetUnit || !assignSpotId) return;
    const prop = properties.find(p => p.Property_ID === parkingTargetUnit.Property_ID);
    if (!prop) return;

    // Check if the spot is already assigned to someone else
    const spot = prop.Parking_Spots?.find(s => s.Spot_ID === assignSpotId);
    if (assignTenantId && spot && spot.Status === 'Assigned' && spot.Assigned_Tenant_ID && spot.Assigned_Tenant_ID !== assignTenantId) {
      onToast(`Validation Error: Parking spot "${spot.Spot_Number_Name}" is already allotted to ${spot.Assigned_Tenant_Name || 'another tenant'}. Cannot double-allot.`, 'error');
      return;
    }

    storage.assignParkingSpot(
      prop.Property_ID,
      assignSpotId,
      assignTenantId || undefined,
      assignPlate || undefined,
      currentUser.Email
    );

    const tenant = tenants.find(t => t.Tenant_ID === assignTenantId);
    if (assignTenantId) {
      onToast(`Assigned parking spot "${spot?.Spot_Number_Name || assignSpotId}" to ${tenant?.Full_Name || 'tenant'}!`, 'success');
    } else {
      onToast(`Unassigned parking spot "${spot?.Spot_Number_Name || assignSpotId}"`, 'info');
    }
    setParkingModalOpen(false);
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-indigo-600" />
            Units & Inventory Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure available rooms, washrooms, kitchen, and den. Rent and utilities are assigned per tenant on lease creation.
          </p>
        </div>

        <button
          id="btn-add-unit"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Unit / Inventory
        </button>
      </div>

      {/* KPI Cards: Dynamic Room Allocation & Vacancy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Units</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{units.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Home className="w-3 h-3 text-indigo-600" />
            {properties.length} Active Properties
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Dynamic Capacity</p>
          <p className="text-xl font-extrabold text-purple-700 mt-1">
            {totalCapacityAll} <span className="text-xs font-medium text-slate-500">Tenants Max</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Calculated from shared beds + whole rooms
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Current Occupancy</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {totalOccupiedAll} <span className="text-xs font-medium text-slate-500">Occupied ({occupancyPercentage}%)</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Active leases across all suites
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Available Vacancies</p>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {totalVacantAll} <span className="text-xs font-medium text-slate-500">Vacant Spaces</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalVacantAll === 0 ? 'Full portfolio occupancy' : 'Eligible for new tenant leases'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by suite title, floor plan, or property name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
          >
            <option value="ALL">All Properties</option>
            {properties.map(p => (
              <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name} ({p.City})</option>
            ))}
          </select>

          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
          >
            <option value="ALL">All Floor Divisions</option>
            <option value="NONE">Standard / Undivided</option>
            <option value="Main Floor">🏠 Main Floor</option>
            <option value="Basement">🏡 Basement</option>
            <option value="Upper Floor">🔼 Upper Floor</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUnits.map((unit) => {
          const property = properties.find(p => p.Property_ID === unit.Property_ID);
          const occ = getUnitOccupancySummary(unit, leases, tenants);
          const parkingAvail = property ? getPropertyParkingAvailability(property, leases, tenants) : null;

          return (
            <div
              key={unit.Unit_ID}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">
                        {unit.Unit_Number_Name || unit.Unit_Number || `Suite ${unit.Unit_ID}`}
                      </span>
                      {getStatusBadge(unit.Current_Status)}
                      {occ.isFullyOccupied ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          100% Full ({occ.totalOccupied} Tenants)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {occ.totalVacantSpaces} Vacant Space{occ.totalVacantSpaces === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {property?.Property_Name || unit.Property_ID} ({property?.City || 'Property'})
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(unit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Unit & Amenities"
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

                {/* Sub-Unit Floor Division Tag */}
                {unit.Division_Level && unit.Division_Level !== 'None' && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      unit.Division_Level === 'Main Floor' ? 'bg-blue-100 text-blue-800' :
                      unit.Division_Level === 'Basement' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {unit.Division_Level === 'Main Floor' ? '🏠 Main Floor Division' :
                       unit.Division_Level === 'Basement' ? '🏡 Basement Suite Division' : unit.Division_Level}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Floor-level Division
                    </span>
                  </div>
                )}

                {/* Specifications Bar: Rooms, Washrooms, Kitchen, Den */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ROOMS</span>
                    <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                      <Bed className="w-3.5 h-3.5 text-indigo-500" /> {unit.Bedrooms || 1} Rooms
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">WASHROOMS</span>
                    <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                      <Bath className="w-3.5 h-3.5 text-indigo-500" /> {unit.Bathrooms || 1} Baths
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">KITCHEN</span>
                    <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5 truncate" title={unit.Kitchen_Type || 'Full Kitchen'}>
                      <Utensils className="w-3.5 h-3.5 text-amber-600" /> {unit.Kitchen_Type ? unit.Kitchen_Type.replace(' Kitchen', '') : 'Full'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DEN</span>
                    <span className={`font-bold flex items-center justify-center gap-1 mt-0.5 ${unit.Has_Den ? 'text-indigo-700' : 'text-slate-400'}`}>
                      <Armchair className="w-3.5 h-3.5 text-indigo-500" /> {unit.Has_Den ? (unit.Dens_Count && unit.Dens_Count > 1 ? `${unit.Dens_Count} Dens` : 'Includes Den') : 'No Den'}
                    </span>
                  </div>
                </div>

                {/* Dynamic Room Allocation & Vacancy Card */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Live Room Occupancy ({occ.totalOccupied}/{occ.totalCapacity} Tenants)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      occ.isFullyOccupied ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {occ.isFullyOccupied ? 'No Vacancies' : `${occ.totalVacantSpaces} Space${occ.totalVacantSpaces === 1 ? '' : 's'} Left`}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {occ.rooms.map((rm) => (
                      <div
                        key={rm.roomId}
                        className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                          rm.isFullRoomOccupied
                            ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                            : rm.occupiedSpacesCount === 2
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : rm.occupiedSpacesCount === 1
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold flex items-center gap-1">
                            <Bed className="w-3 h-3 text-indigo-500" />
                            <span>{rm.roomName}</span>
                            {rm.ensuiteBath && (
                              <span className="text-[9px] px-1 bg-cyan-100 text-cyan-800 rounded font-semibold">Ensuite</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            {rm.isFullRoomOccupied ? (
                              <span className="font-semibold text-purple-800">
                                👤 Whole Room Leased to {rm.occupantTenantNames[0]} (Exclusive 1 Tenant)
                              </span>
                            ) : rm.occupiedSpacesCount === 2 ? (
                              <span className="font-medium text-emerald-800">
                                👥 2 Sharing Beds Filled: {rm.bedASpace.tenantName} & {rm.bedBSpace.tenantName}
                              </span>
                            ) : rm.occupiedSpacesCount === 1 ? (
                              <span className="font-medium text-amber-900">
                                🛏️ 1 Space Left ({rm.availableBedSlot || 'Bed B'}) · Occupant: {rm.bedASpace.isOccupied ? rm.bedASpace.tenantName : rm.bedBSpace.tenantName}
                                <span className="block text-[9px] text-amber-700 font-semibold">
                                  Full room not accommodated (bed occupied)
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">
                                ✨ Vacant · Can accommodate 1 Full Room OR 2 Sharing Beds
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            rm.isFullRoomOccupied || rm.occupiedSpacesCount === 2
                              ? 'bg-emerald-100 text-emerald-800'
                              : rm.occupiedSpacesCount === 1
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rm.isFullRoomOccupied
                              ? 'Full Room (1/1)'
                              : `${rm.occupiedSpacesCount}/${rm.capacity} Filled`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary note explaining the user's vacancy calculation */}
                  <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Rent & Utilities:</span>
                    <span className="font-semibold text-slate-700">
                      Assigned to each tenant upon lease creation
                    </span>
                  </div>
                </div>

                {/* Property Parking Allocation Indicator */}
                {parkingAvail && parkingAvail.totalSpots > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                      <Car className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Property Parking: {parkingAvail.assignedSpots} of {parkingAvail.totalSpots} spots assigned</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        parkingAvail.availableSpots > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {parkingAvail.availableSpots > 0 ? `${parkingAvail.availableSpots} Spot${parkingAvail.availableSpots === 1 ? '' : 's'} Free` : 'Parking Full'}
                      </span>
                      <button
                        onClick={() => handleOpenAssignParking(unit)}
                        className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-200 transition-colors"
                        title="Manage Parking Tagging"
                      >
                        <Key className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(unit)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Unit Specifications
                </button>
                <span className="text-[10px] text-slate-400 font-mono">ID: {unit.Unit_ID}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simplified Add / Edit Unit Modal (Rooms, Washrooms, Baths, Kitchen, Kitchen Type, Den) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUnit ? `Edit Suite: ${editingUnit.Unit_Number_Name || editingUnit.Unit_ID}` : 'Add Unit / Inventory'}
                </h3>
                <p className="text-xs text-slate-500">Configure available rooms, washrooms, kitchen, and den</p>
              </div>
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
                      <option key={p.Property_ID} value={p.Property_ID}>
                        {p.Property_Name} ({p.City})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit / Suite Title *</label>
                  <input
                    type="text"
                    value={formData.Unit_Number}
                    onChange={(e) => setFormData({ ...formData, Unit_Number: e.target.value })}
                    placeholder="e.g. Main Floor (3 Rooms), Room 1, or Basement Suite"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Sub-Unit Floor Division Configuration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">Floor Division / Segment Level</label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Floor Segment
                  </span>
                </div>
                <select
                  value={formData.Division_Level || 'None'}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      Division_Level: e.target.value
                    });
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                >
                  <option value="None">None (Whole Property / Standard Unit)</option>
                  <option value="Main Floor">🏠 Main Floor Division</option>
                  <option value="Basement">🏡 Basement Suite Division</option>
                  <option value="Upper Floor">🔼 Upper Floor Division</option>
                  <option value="Laneway House">🏡 Laneway / Carriage House</option>
                </select>
              </div>

              {/* CORE AMENITIES: Available Rooms, Washrooms, Kitchen, Kitchen Type */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-indigo-600" />
                    Available Rooms & Amenities
                  </h4>
                  <span className="text-[10px] text-slate-500">Rooms, Washrooms, Kitchen & Den</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Available Rooms</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.Bedrooms}
                      onChange={(e) => setFormData({ ...formData, Bedrooms: parseInt(e.target.value) || 1 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Washrooms / Baths</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="10"
                      value={formData.Bathrooms}
                      onChange={(e) => setFormData({ ...formData, Bathrooms: parseFloat(e.target.value) || 1 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kitchens Count</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={formData.Kitchens}
                      onChange={(e) => setFormData({ ...formData, Kitchens: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kitchen Type</label>
                    <select
                      value={formData.Kitchen_Type}
                      onChange={(e) => setFormData({ ...formData, Kitchen_Type: e.target.value as any })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                    >
                      <option value="Full Kitchen">Full Kitchen</option>
                      <option value="Kitchenette">Kitchenette</option>
                      <option value="Shared Kitchen">Shared Kitchen</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                {/* Unit Includes Den Configuration */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.Has_Den}
                        onChange={(e) => setFormData({
                          ...formData,
                          Has_Den: e.target.checked,
                          Dens_Count: e.target.checked ? (formData.Dens_Count || 1) : 0
                        })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5 text-indigo-600" />
                        Unit Includes Den
                      </span>
                    </label>
                    {formData.Has_Den && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Den Enabled
                      </span>
                    )}
                  </div>

                  {formData.Has_Den && (
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Den Count</label>
                        <input
                          type="number"
                          min="1"
                          max="4"
                          value={formData.Dens_Count || 1}
                          onChange={(e) => setFormData({ ...formData, Dens_Count: parseInt(e.target.value) || 1 })}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Den Details / Usage</label>
                        <input
                          type="text"
                          value={formData.Den_Details}
                          onChange={(e) => setFormData({ ...formData, Den_Details: e.target.value })}
                          placeholder="e.g. Enclosed private work study or secondary lounge"
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Square Feet */}
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Occupancy Status</label>
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
                <label className="block font-bold text-slate-700 mb-1">Notes & Details</label>
                <textarea
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="e.g. Private entrance, furnished lounge, separate meters"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  {editingUnit ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PROPERTY PARKING ASSIGNMENT MODAL */}
      {parkingModalOpen && parkingTargetUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Property Parking Assignment</h3>
                  <p className="text-[11px] text-slate-500">
                    Tag property parking spot to a tenant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setParkingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const prop = properties.find(p => p.Property_ID === parkingTargetUnit.Property_ID);
              const spots = prop?.Parking_Spots || [];
              const propTenants = tenants.filter(t =>
                t.Current_Property_ID === parkingTargetUnit.Property_ID ||
                t.Current_Unit_ID === parkingTargetUnit.Unit_ID
              );

              if (spots.length === 0) {
                return (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2 text-xs">
                    <Car className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">No Parking Spots on Property</p>
                    <p className="text-[11px] text-slate-500">
                      Parking is a property-level resource. Please add parking spots to "{prop?.Property_Name}" under the Properties tab.
                    </p>
                    <button
                      type="button"
                      onClick={() => setParkingModalOpen(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              return (
                <form onSubmit={handleConfirmAssignParking} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Property Parking Spot *</label>
                    <select
                      value={assignSpotId}
                      onChange={(e) => setAssignSpotId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white"
                      required
                    >
                      {spots.map(s => (
                        <option key={s.Spot_ID} value={s.Spot_ID}>
                          {s.Spot_Number_Name} ({s.Spot_Type}) - {s.Status} {s.Monthly_Fee ? `($${s.Monthly_Fee}/mo)` : '($0)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assign to Tenant</label>
                    <select
                      value={assignTenantId}
                      onChange={(e) => setAssignTenantId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white"
                    >
                      <option value="">-- None (Keep / Make Spot Available) --</option>
                      {propTenants.map(t => (
                        <option key={t.Tenant_ID} value={t.Tenant_ID}>
                          {t.Full_Name} ({t.Current_Unit_ID || 'Tenant'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Select a tenant to assign this parking spot, or select "None" to unassign.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle License Plate (Optional)</label>
                    <input
                      type="text"
                      value={assignPlate}
                      onChange={(e) => setAssignPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. BXYZ 491"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs uppercase focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setParkingModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      Save Assignment
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Confirm Delete Unit Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUnit}
        title="Delete Unit / Suite"
        itemName={deletingUnit ? `${deletingUnit.Unit_Number_Name || deletingUnit.Unit_Number || deletingUnit.Unit_ID} (${deletingUnit.Unit_ID})` : ''}
        itemType="unit"
        warningMessage="Deleting this suite will remove it from property inventory and space vacancy metrics."
        onConfirm={handleDeleteUnitConfirm}
        onCancel={() => setDeletingUnit(null)}
      />
    </div>
  );
};
