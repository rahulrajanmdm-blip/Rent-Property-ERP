import React, { useState, useMemo } from 'react';
import {
  FileSignature, Plus, FolderPlus, ExternalLink, Calendar,
  DollarSign, CheckCircle2, ShieldAlert, Building, DoorOpen,
  Edit3, Trash2, X, Split, Home, Bed, UserCheck, Users, Car,
  Zap, AlertCircle, Info, Check, Receipt
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { Lease, User, Unit, Property, Tenant, UnitSpace, RoomOccupant } from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { IndividualExpensesModal } from './IndividualExpensesModal';
import {
  getUnitOccupancySummary,
  validateRoomAllocation,
  getPropertyParkingAvailability,
  validateParkingAllotment
} from '../utils/roomAllocation';

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
  const [activeExpensesLease, setActiveExpensesLease] = useState<Lease | null>(null);

  // Lease Form State
  const [form, setForm] = useState<{
    Tenant_ID: string;
    Property_ID: string;
    Unit_ID: string;
    Room_Index: number;
    Room_Name: string;
    Booking_Type: 'Sharing Bed' | 'Full Room' | 'Joint Group (2 People)' | 'Joint Group (3 People)';
    Bed_Slot: 'Bed A' | 'Bed B';
    Space_ID?: string;
    Space_Name?: string;
    Bedroom_ID?: string;
    Bedroom_Name?: string;
    Is_Full_Bedroom: boolean;
    Is_Full_Room: boolean;
    Lease_Start: string;
    Lease_End: string;
    Monthly_Rent: number;
    Deposit_Required: number;
    Last_Month_Rent: number;
    Status: Lease['Status'];
    Utilities_Included: boolean;
    Allot_Parking: boolean;
    Parking_Spot_ID: string;
    Parking_Spot_Name: string;
    Parking_Fee: number;
    Vehicle_Plate: string;
    Notes: string;
    // Joint Group Co-occupants & individual utilities:
    Charge_Utilities_Individually: boolean;
    Primary_Share: number;
    CoOccupant1_Tenant_ID: string;
    CoOccupant1_Name: string;
    CoOccupant1_Email: string;
    CoOccupant1_Phone: string;
    CoOccupant1_Share: number;
    CoOccupant2_Tenant_ID: string;
    CoOccupant2_Name: string;
    CoOccupant2_Email: string;
    CoOccupant2_Phone: string;
    CoOccupant2_Share: number;
  }>({
    Tenant_ID: '',
    Property_ID: properties[0]?.Property_ID || '',
    Unit_ID: units[0]?.Unit_ID || '',
    Room_Index: 1,
    Room_Name: 'Room 1',
    Booking_Type: 'Sharing Bed',
    Bed_Slot: 'Bed A',
    Space_ID: undefined,
    Space_Name: 'Room 1 - Bed A (Sharing)',
    Bedroom_ID: 'BR-1',
    Bedroom_Name: 'Room 1',
    Is_Full_Bedroom: false,
    Is_Full_Room: false,
    Lease_Start: new Date().toISOString().slice(0, 10),
    Lease_End: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    Monthly_Rent: 0,
    Deposit_Required: 0,
    Last_Month_Rent: 0,
    Status: 'Active' as Lease['Status'],
    Utilities_Included: false,
    Allot_Parking: false,
    Parking_Spot_ID: '',
    Parking_Spot_Name: '',
    Parking_Fee: 50,
    Vehicle_Plate: '',
    Notes: 'Standard Tenancy Agreement. Rent and utilities configured for tenant.',
    Charge_Utilities_Individually: true,
    Primary_Share: 50,
    CoOccupant1_Tenant_ID: '',
    CoOccupant1_Name: '',
    CoOccupant1_Email: '',
    CoOccupant1_Phone: '',
    CoOccupant1_Share: 50,
    CoOccupant2_Tenant_ID: '',
    CoOccupant2_Name: '',
    CoOccupant2_Email: '',
    CoOccupant2_Phone: '',
    CoOccupant2_Share: 33.33
  });

  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;
  const tenantName = (id: string) => tenants.find(t => t.Tenant_ID === id)?.Full_Name || id;
  const unitName = (id: string) => units.find(u => u.Unit_ID === id)?.Unit_Number_Name || units.find(u => u.Unit_ID === id)?.Unit_Number || id;
  const selectedProp = properties.find(p => p.Property_ID === form.Property_ID);
  const selectedUnitObj = units.find(u => u.Unit_ID === form.Unit_ID);

  // Set of tenant IDs that currently have an active lease (excluding the lease currently being edited)
  const currentlyLeasedTenantIds = useMemo(() => {
    const set = new Set<string>();
    leases.forEach(l => {
      if (l.Status !== 'Active') return;
      if (editingLease && l.Lease_ID === editingLease.Lease_ID) return;
      if (l.Tenant_ID) set.add(l.Tenant_ID);
      if (l.Occupants) {
        l.Occupants.forEach(occ => {
          if (occ.Occupant_ID) set.add(occ.Occupant_ID);
        });
      }
    });
    return set;
  }, [leases, editingLease]);

  // Available tenants for Primary Tenant selection (exclude already leased tenants)
  const availablePrimaryTenants = useMemo(() => {
    return tenants.filter(t => {
      if (editingLease && (editingLease.Tenant_ID === t.Tenant_ID || editingLease.Occupants?.some(o => o.Occupant_ID === t.Tenant_ID))) {
        return true;
      }
      if (editingLease && t.Tenant_ID === form.Tenant_ID) {
        return true;
      }
      return !currentlyLeasedTenantIds.has(t.Tenant_ID);
    });
  }, [tenants, currentlyLeasedTenantIds, editingLease, form.Tenant_ID]);

  // Available properties for lease creation (exclude properties that are fully occupied)
  const availableProperties = useMemo(() => {
    return properties.filter(p => {
      // If currently editing this lease on this property, preserve it
      if (editingLease && p.Property_ID === editingLease.Property_ID) return true;
      const propUnits = units.filter(u => u.Property_ID === p.Property_ID);
      if (propUnits.length === 0) return true;
      // Property has at least one unit with vacant spaces
      return propUnits.some(u => {
        const occ = getUnitOccupancySummary(u, leases, tenants);
        return !occ.isFullyOccupied && occ.totalVacantSpaces > 0;
      });
    });
  }, [properties, units, leases, tenants, editingLease]);

  // Available units for the selected property that have vacancies
  const availableUnitsForSelectedProperty = useMemo(() => {
    return units
      .filter(u => u.Property_ID === form.Property_ID)
      .filter(u => {
        if (editingLease && u.Unit_ID === editingLease.Unit_ID) return true;
        const occ = getUnitOccupancySummary(u, leases, tenants);
        return !occ.isFullyOccupied && occ.totalVacantSpaces > 0;
      });
  }, [units, form.Property_ID, editingLease, leases, tenants]);

  // Available co-occupant tenants (exclude primary tenant and other already leased tenants)
  const availableCoOccupant1Tenants = useMemo(() => {
    return tenants.filter(t => {
      if (t.Tenant_ID === form.Tenant_ID) return false;
      if (t.Tenant_ID === form.CoOccupant2_Tenant_ID) return false;
      if (editingLease && editingLease.Occupants?.some(o => o.Occupant_ID === t.Tenant_ID)) return true;
      if (editingLease && t.Tenant_ID === form.CoOccupant1_Tenant_ID) return true;
      return !currentlyLeasedTenantIds.has(t.Tenant_ID);
    });
  }, [tenants, form.Tenant_ID, form.CoOccupant2_Tenant_ID, form.CoOccupant1_Tenant_ID, currentlyLeasedTenantIds, editingLease]);

  const availableCoOccupant2Tenants = useMemo(() => {
    return tenants.filter(t => {
      if (t.Tenant_ID === form.Tenant_ID) return false;
      if (t.Tenant_ID === form.CoOccupant1_Tenant_ID) return false;
      if (editingLease && editingLease.Occupants?.some(o => o.Occupant_ID === t.Tenant_ID)) return true;
      if (editingLease && t.Tenant_ID === form.CoOccupant2_Tenant_ID) return true;
      return !currentlyLeasedTenantIds.has(t.Tenant_ID);
    });
  }, [tenants, form.Tenant_ID, form.CoOccupant1_Tenant_ID, form.CoOccupant2_Tenant_ID, currentlyLeasedTenantIds, editingLease]);

  // Compute live occupancy for the selected unit
  const unitOccupancy = selectedUnitObj ? getUnitOccupancySummary(selectedUnitObj, leases, tenants) : null;
  const parkingAvailability = selectedProp ? getPropertyParkingAvailability(selectedProp, leases, tenants) : null;

  // Compute selected room's occupancy status
  const currentRoomOcc = unitOccupancy?.rooms.find(r => r.roomIndex === form.Room_Index);
  const isSelectedRoomFullTaken = currentRoomOcc ? (currentRoomOcc.isFullRoomOccupied || currentRoomOcc.occupiedSpacesCount === 2) : false;
  const isSelectedRoomPartialTaken = currentRoomOcc ? (currentRoomOcc.occupiedSpacesCount === 1 && !currentRoomOcc.isFullRoomOccupied) : false;

  const handlePropertyChange = (propId: string) => {
    const propUnits = units.filter(u => u.Property_ID === propId);
    const firstUnit = propUnits.find(u => {
      const uOcc = getUnitOccupancySummary(u, leases, tenants);
      return !uOcc.isFullyOccupied && uOcc.totalVacantSpaces > 0;
    }) || propUnits[0];
    const newUnitId = firstUnit?.Unit_ID || '';
    const occ = firstUnit ? getUnitOccupancySummary(firstUnit, leases, tenants) : null;

    // Pick first available room
    const firstAvailRoom = occ?.rooms.find(r => !r.isFullRoomOccupied && r.occupiedSpacesCount < 2) || occ?.rooms[0];
    const roomIdx = firstAvailRoom ? firstAvailRoom.roomIndex : 1;
    const roomName = firstAvailRoom ? firstAvailRoom.roomName : 'Room 1';
    const bookingType: 'Sharing Bed' | 'Full Room' = 'Sharing Bed';
    const bedSlot = (firstAvailRoom?.availableBedSlot as 'Bed A' | 'Bed B') || 'Bed A';

    const prop = properties.find(p => p.Property_ID === propId);
    const availSpot = prop?.Parking_Spots?.find(s => s.Status === 'Available');

    setForm(prev => ({
      ...prev,
      Property_ID: propId,
      Unit_ID: newUnitId,
      Room_Index: roomIdx,
      Room_Name: roomName,
      Bedroom_ID: `BR-${roomIdx}`,
      Bedroom_Name: roomName,
      Booking_Type: bookingType,
      Bed_Slot: bedSlot,
      Space_ID: `SPACE-U${newUnitId}-R${roomIdx}-${bedSlot === 'Bed A' ? 'A' : 'B'}`,
      Space_Name: `${roomName} - ${bedSlot} (Sharing)`,
      Is_Full_Bedroom: false,
      Is_Full_Room: false,
      Parking_Spot_ID: availSpot?.Spot_ID || '',
      Parking_Spot_Name: availSpot?.Spot_Number_Name || ''
    }));
  };

  const handleUnitChange = (unitId: string) => {
    const u = units.find(x => x.Unit_ID === unitId);
    const occ = u ? getUnitOccupancySummary(u, leases, tenants) : null;

    const firstAvailRoom = occ?.rooms.find(r => !r.isFullRoomOccupied && r.occupiedSpacesCount < 2) || occ?.rooms[0];
    const roomIdx = firstAvailRoom ? firstAvailRoom.roomIndex : 1;
    const roomName = firstAvailRoom ? firstAvailRoom.roomName : 'Room 1';
    const bookingType: 'Sharing Bed' | 'Full Room' = 'Sharing Bed';
    const bedSlot = (firstAvailRoom?.availableBedSlot as 'Bed A' | 'Bed B') || 'Bed A';

    setForm(prev => ({
      ...prev,
      Unit_ID: unitId,
      Room_Index: roomIdx,
      Room_Name: roomName,
      Bedroom_ID: `BR-${roomIdx}`,
      Bedroom_Name: roomName,
      Booking_Type: bookingType,
      Bed_Slot: bedSlot,
      Space_ID: `SPACE-U${unitId}-R${roomIdx}-${bedSlot === 'Bed A' ? 'A' : 'B'}`,
      Space_Name: `${roomName} - ${bedSlot} (Sharing)`,
      Is_Full_Bedroom: false,
      Is_Full_Room: false
    }));
  };

  const handleRoomChange = (roomNumber: number) => {
    const roomOcc = unitOccupancy?.rooms.find(r => r.roomIndex === roomNumber);
    const roomName = roomOcc?.roomName || `Room ${roomNumber}`;
    const isPartial = roomOcc ? (roomOcc.occupiedSpacesCount === 1 && !roomOcc.isFullRoomOccupied) : false;

    // If room is partial, booking type MUST be Sharing Bed
    const bookingType: 'Sharing Bed' | 'Full Room' = isPartial ? 'Sharing Bed' : form.Booking_Type;
    const bedSlot: 'Bed A' | 'Bed B' = (roomOcc?.availableBedSlot as 'Bed A' | 'Bed B') || 'Bed A';

    setForm(prev => ({
      ...prev,
      Room_Index: roomNumber,
      Room_Name: roomName,
      Bedroom_ID: `BR-${roomNumber}`,
      Bedroom_Name: roomName,
      Booking_Type: bookingType,
      Bed_Slot: bedSlot,
      Space_ID: bookingType === 'Full Room'
        ? undefined
        : `SPACE-U${prev.Unit_ID}-R${roomNumber}-${bedSlot === 'Bed A' ? 'A' : 'B'}`,
      Space_Name: bookingType === 'Full Room'
        ? `${roomName} (Full Room Exclusive)`
        : `${roomName} - ${bedSlot} (Sharing)`,
      Is_Full_Bedroom: bookingType === 'Full Room',
      Is_Full_Room: false
    }));
  };

  const handleBookingTypeChange = (type: 'Sharing Bed' | 'Full Room' | 'Joint Group (2 People)' | 'Joint Group (3 People)') => {
    // Validation check: If room is partially occupied, full room or joint groups CANNOT be accommodated
    if ((type === 'Full Room' || type === 'Joint Group (2 People)' || type === 'Joint Group (3 People)') && isSelectedRoomPartialTaken) {
      onToast(`Validation Alert: ${form.Room_Name} already has 1 occupant in a bed space. Only 1 sharing space (${currentRoomOcc?.availableBedSlot || 'Bed B'}) is available; full room or joint group cannot be accommodated.`, 'error');
      return;
    }

    let isFull = false;
    let primaryShare = 100;
    let co1Share = 0;
    let co2Share = 0;

    if (type === 'Full Room') {
      isFull = true;
    } else if (type === 'Joint Group (2 People)') {
      isFull = true;
      primaryShare = 50;
      co1Share = 50;
    } else if (type === 'Joint Group (3 People)') {
      isFull = true;
      primaryShare = 33.34;
      co1Share = 33.33;
      co2Share = 33.33;
    }

    setForm(prev => ({
      ...prev,
      Booking_Type: type,
      Is_Full_Bedroom: isFull,
      Is_Full_Room: false,
      Space_ID: isFull
        ? undefined
        : `SPACE-U${prev.Unit_ID}-R${prev.Room_Index}-${prev.Bed_Slot === 'Bed A' ? 'A' : 'B'}`,
      Space_Name: type === 'Full Room'
        ? `${prev.Room_Name} (Full Room Exclusive)`
        : type === 'Joint Group (2 People)'
        ? `${prev.Room_Name} (Joint Group - 2 People)`
        : type === 'Joint Group (3 People)'
        ? `${prev.Room_Name} (Joint Group - 3 People)`
        : `${prev.Room_Name} - ${prev.Bed_Slot} (Sharing)`,
      Primary_Share: primaryShare,
      CoOccupant1_Share: co1Share,
      CoOccupant2_Share: co2Share
    }));
  };

  const handleBedSlotChange = (slot: 'Bed A' | 'Bed B') => {
    setForm(prev => ({
      ...prev,
      Bed_Slot: slot,
      Space_ID: `SPACE-U${prev.Unit_ID}-R${prev.Room_Index}-${slot === 'Bed A' ? 'A' : 'B'}`,
      Space_Name: `${prev.Room_Name} - ${slot} (Sharing)`
    }));
  };

  const handleOpenAdd = () => {
    setEditingLease(null);
    const defaultProp = availableProperties[0]?.Property_ID || properties[0]?.Property_ID || '';
    const propUnits = units.filter(u => u.Property_ID === defaultProp);
    const firstUnit = propUnits.find(u => {
      const uOcc = getUnitOccupancySummary(u, leases, tenants);
      return !uOcc.isFullyOccupied && uOcc.totalVacantSpaces > 0;
    }) || propUnits[0];
    const occ = firstUnit ? getUnitOccupancySummary(firstUnit, leases, tenants) : null;
    const firstAvailRoom = occ?.rooms.find(r => !r.isFullRoomOccupied && r.occupiedSpacesCount < 2) || occ?.rooms[0];
    const roomIdx = firstAvailRoom ? firstAvailRoom.roomIndex : 1;
    const roomName = firstAvailRoom ? firstAvailRoom.roomName : 'Room 1';
    const bedSlot = (firstAvailRoom?.availableBedSlot as 'Bed A' | 'Bed B') || 'Bed A';

    const prop = properties.find(p => p.Property_ID === defaultProp);
    const availSpot = prop?.Parking_Spots?.find(s => s.Status === 'Available');
    const defaultTenant = availablePrimaryTenants[0]?.Tenant_ID || '';

    setForm({
      Tenant_ID: defaultTenant,
      Property_ID: defaultProp,
      Unit_ID: firstUnit?.Unit_ID || '',
      Room_Index: roomIdx,
      Room_Name: roomName,
      Booking_Type: 'Sharing Bed',
      Bed_Slot: bedSlot,
      Space_ID: `SPACE-U${firstUnit?.Unit_ID}-R${roomIdx}-${bedSlot === 'Bed A' ? 'A' : 'B'}`,
      Space_Name: `${roomName} - ${bedSlot} (Sharing)`,
      Bedroom_ID: `BR-${roomIdx}`,
      Bedroom_Name: roomName,
      Is_Full_Bedroom: false,
      Is_Full_Room: false,
      Lease_Start: new Date().toISOString().slice(0, 10),
      Lease_End: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      Monthly_Rent: 0,
      Deposit_Required: 0,
      Last_Month_Rent: 0,
      Status: 'Active',
      Utilities_Included: false,
      Allot_Parking: false,
      Parking_Spot_ID: availSpot?.Spot_ID || '',
      Parking_Spot_Name: availSpot?.Spot_Number_Name || '',
      Parking_Fee: 50,
      Vehicle_Plate: '',
      Notes: 'Standard Tenancy Agreement. Rent and utilities configured for tenant.',
      Charge_Utilities_Individually: true,
      Primary_Share: 50,
      CoOccupant1_Tenant_ID: '',
      CoOccupant1_Name: '',
      CoOccupant1_Email: '',
      CoOccupant1_Phone: '',
      CoOccupant1_Share: 50,
      CoOccupant2_Tenant_ID: '',
      CoOccupant2_Name: '',
      CoOccupant2_Email: '',
      CoOccupant2_Phone: '',
      CoOccupant2_Share: 33.33
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lease: Lease) => {
    setEditingLease(lease);
    const u = units.find(x => x.Unit_ID === lease.Unit_ID);
    const occ = u ? getUnitOccupancySummary(u, leases, tenants) : null;
    const roomNum = lease.Bedroom_ID ? parseInt(lease.Bedroom_ID.replace('BR-', '')) || 1 : 1;
    const roomOcc = occ?.rooms.find(r => r.roomIndex === roomNum);

    const isJoint = !!lease.Occupancy_Type?.includes('Joint') || (lease.Occupants && lease.Occupants.length > 1);
    const occupantsCount = lease.Occupants_Count || (lease.Occupants ? lease.Occupants.length : 1);
    let bookingType: 'Sharing Bed' | 'Full Room' | 'Joint Group (2 People)' | 'Joint Group (3 People)' = 'Sharing Bed';
    if (isJoint) {
      bookingType = occupantsCount === 3 ? 'Joint Group (3 People)' : 'Joint Group (2 People)';
    } else if (lease.Is_Full_Bedroom) {
      bookingType = 'Full Room';
    }

    const isFull = !!lease.Is_Full_Bedroom || isJoint;
    const bedSlot: 'Bed A' | 'Bed B' = lease.Space_Name?.includes('Bed B') ? 'Bed B' : 'Bed A';

    const occList = lease.Occupants || [];
    const primaryOcc = occList.find(o => o.Is_Primary) || occList[0];
    const co1 = occList.filter(o => !o.Is_Primary)[0];
    const co2 = occList.filter(o => !o.Is_Primary)[1];

    const co1Tenant = tenants.find(t => t.Tenant_ID === co1?.Occupant_ID) ||
                      tenants.find(t => !!co1?.Full_Name && t.Full_Name.toLowerCase() === co1.Full_Name.toLowerCase());
    const co2Tenant = tenants.find(t => t.Tenant_ID === co2?.Occupant_ID) ||
                      tenants.find(t => !!co2?.Full_Name && t.Full_Name.toLowerCase() === co2.Full_Name.toLowerCase());

    setForm({
      Tenant_ID: lease.Tenant_ID,
      Property_ID: lease.Property_ID,
      Unit_ID: lease.Unit_ID,
      Room_Index: roomNum,
      Room_Name: lease.Bedroom_Name || `Room ${roomNum}`,
      Booking_Type: bookingType,
      Bed_Slot: bedSlot,
      Space_ID: lease.Space_ID,
      Space_Name: lease.Space_Name,
      Bedroom_ID: lease.Bedroom_ID,
      Bedroom_Name: lease.Bedroom_Name,
      Is_Full_Bedroom: isFull,
      Is_Full_Room: !!lease.Is_Full_Room,
      Lease_Start: lease.Lease_Start,
      Lease_End: lease.Lease_End || '',
      Monthly_Rent: lease.Monthly_Rent,
      Deposit_Required: lease.Deposit_Required || 0,
      Last_Month_Rent: lease.Last_Month_Rent || 0,
      Status: lease.Status,
      Utilities_Included: lease.Utilities_Included !== undefined ? lease.Utilities_Included : true,
      Allot_Parking: !!lease.Parking_Spot_ID,
      Parking_Spot_ID: lease.Parking_Spot_ID || '',
      Parking_Spot_Name: lease.Parking_Spot_Name || '',
      Parking_Fee: lease.Parking_Fee || 50,
      Vehicle_Plate: lease.Vehicle_Plate || '',
      Notes: lease.Notes || '',
      Charge_Utilities_Individually: lease.Charge_Utilities_Individually !== false,
      Primary_Share: primaryOcc?.Utility_Share_Percentage ?? (isJoint ? (occupantsCount === 3 ? 33.34 : 50) : 100),
      CoOccupant1_Tenant_ID: co1Tenant?.Tenant_ID || co1?.Occupant_ID || '',
      CoOccupant1_Name: co1?.Full_Name || co1Tenant?.Full_Name || '',
      CoOccupant1_Email: co1?.Email || co1Tenant?.Email || '',
      CoOccupant1_Phone: co1?.Phone || co1Tenant?.Phone || '',
      CoOccupant1_Share: co1?.Utility_Share_Percentage ?? (isJoint ? (occupantsCount === 3 ? 33.33 : 50) : 0),
      CoOccupant2_Tenant_ID: co2Tenant?.Tenant_ID || co2?.Occupant_ID || '',
      CoOccupant2_Name: co2?.Full_Name || co2Tenant?.Full_Name || '',
      CoOccupant2_Email: co2?.Email || co2Tenant?.Email || '',
      CoOccupant2_Phone: co2?.Phone || co2Tenant?.Phone || '',
      CoOccupant2_Share: co2?.Utility_Share_Percentage ?? 33.33
    });
    setShowModal(true);
  };

  const handleSaveLease = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedUnit = units.find(u => u.Unit_ID === form.Unit_ID);
      const selectedProperty = properties.find(p => p.Property_ID === form.Property_ID);

      if (!selectedUnit) {
        onToast('Please select a valid unit/inventory suite', 'error');
        return;
      }

      // 1. STRICT ROOM & SPACE ALLOCATION VALIDATION
      let bookingModeForValidation: 'Single Bed' | 'Full Room (1 Person)' | 'Joint Room (2 People)' | 'Joint Room (3 People)' = 'Single Bed';
      if (form.Booking_Type === 'Full Room') {
        bookingModeForValidation = 'Full Room (1 Person)';
      } else if (form.Booking_Type === 'Joint Group (2 People)') {
        bookingModeForValidation = 'Joint Room (2 People)';
      } else if (form.Booking_Type === 'Joint Group (3 People)') {
        bookingModeForValidation = 'Joint Room (3 People)';
      }

      const allocValidation = validateRoomAllocation(
        selectedUnit,
        leases,
        tenants,
        form.Room_Index,
        bookingModeForValidation,
        editingLease?.Lease_ID
      );

      if (!allocValidation.valid) {
        onToast(`Allocation Error: ${allocValidation.reason}`, 'error');
        return;
      }

      // 2. STRICT PARKING SPOT VALIDATION (IF PARKING IS ALLOTTED)
      if (form.Allot_Parking && form.Parking_Spot_ID && selectedProperty) {
        const parkingValidation = validateParkingAllotment(
          selectedProperty,
          form.Parking_Spot_ID,
          form.Tenant_ID,
          leases,
          tenants,
          editingLease?.Parking_Spot_ID
        );

        if (!parkingValidation.valid) {
          onToast(`Parking Error: ${parkingValidation.reason}`, 'error');
          return;
        }
      }

      // Format Space & Bedroom metadata
      const isJoint = form.Booking_Type === 'Joint Group (2 People)' || form.Booking_Type === 'Joint Group (3 People)';
      const isFull = form.Booking_Type === 'Full Room' || isJoint;

      let occupants: RoomOccupant[] | undefined = undefined;
      let occupancyType: Lease['Occupancy_Type'] = undefined;
      let occupantsCount: number | undefined = undefined;

      const leadTenant = tenants.find(t => t.Tenant_ID === form.Tenant_ID);
      const leadName = leadTenant?.Full_Name || 'Primary Tenant';

      if (isJoint) {
        if (!form.CoOccupant1_Name.trim()) {
          onToast('Please enter the name of the second room occupant.', 'error');
          return;
        }
        if (form.Booking_Type === 'Joint Group (3 People)' && !form.CoOccupant2_Name.trim()) {
          onToast('Please enter the name of the third room occupant.', 'error');
          return;
        }

        occupancyType = form.Booking_Type === 'Joint Group (3 People)' ? 'Joint Room (3 People)' : 'Joint Room (2 People)';
        occupantsCount = form.Booking_Type === 'Joint Group (3 People)' ? 3 : 2;

        const occ1: RoomOccupant = {
          Occupant_ID: form.Tenant_ID,
          Full_Name: leadName,
          Email: leadTenant?.Email,
          Phone: leadTenant?.Phone,
          Is_Primary: true,
          Utility_Share_Percentage: form.Primary_Share,
          Charge_Utilities_Individually: form.Charge_Utilities_Individually,
          Notes: 'Lead Group Tenant'
        };

        const existingOccs = editingLease?.Occupants || [];
        const existingCo1 = existingOccs.filter(o => !o.Is_Primary)[0];

        // 1. Resolve or Create Tenant for Co-Occupant 1
        let co1TenantId = form.CoOccupant1_Tenant_ID;
        let matchedTenant1 = tenants.find(t => t.Tenant_ID === co1TenantId);
        if (!matchedTenant1 && form.CoOccupant1_Name.trim()) {
          matchedTenant1 = tenants.find(t =>
            t.Full_Name.toLowerCase() === form.CoOccupant1_Name.trim().toLowerCase() ||
            (form.CoOccupant1_Email && t.Email && t.Email.toLowerCase() === form.CoOccupant1_Email.trim().toLowerCase())
          );
        }

        if (matchedTenant1) {
          co1TenantId = matchedTenant1.Tenant_ID;
          const updatedT1: Tenant = {
            ...matchedTenant1,
            Current_Property_ID: form.Property_ID,
            Current_Unit_ID: form.Unit_ID,
            Current_Space_Name: `${form.Room_Name} (Co-Occupant)`,
            Status: 'Active'
          };
          storage.updateTenant(updatedT1, currentUser.Email);
        } else if (form.CoOccupant1_Name.trim()) {
          // Automatically register as a new Tenant in Tenants Directory!
          co1TenantId = 'TEN-' + Date.now().toString(36).toUpperCase() + '-1';
          const newTenant1: Tenant = {
            Tenant_ID: co1TenantId,
            Full_Name: form.CoOccupant1_Name.trim(),
            Email: form.CoOccupant1_Email.trim() || `${form.CoOccupant1_Name.trim().toLowerCase().replace(/\s+/g, '.')}@occupant.ca`,
            Phone: form.CoOccupant1_Phone.trim() || 'N/A',
            Emergency_Contact: `Lead Tenant: ${leadName}`,
            Status: 'Active',
            Current_Property_ID: form.Property_ID,
            Current_Unit_ID: form.Unit_ID,
            Current_Space_Name: `${form.Room_Name} (Co-Occupant)`,
            Created_At: new Date().toISOString().slice(0, 10),
            Notes: `Co-Occupant in ${form.Room_Name} (Joint lease with ${leadName}).`
          };
          storage.addTenant(newTenant1, currentUser.Email);
        }

        const occ2: RoomOccupant = {
          Occupant_ID: co1TenantId || existingCo1?.Occupant_ID || ('OCC-' + Date.now().toString(36) + '-1'),
          Full_Name: form.CoOccupant1_Name.trim(),
          Email: form.CoOccupant1_Email.trim() || undefined,
          Phone: form.CoOccupant1_Phone.trim() || undefined,
          Is_Primary: false,
          Utility_Share_Percentage: form.CoOccupant1_Share,
          Charge_Utilities_Individually: form.Charge_Utilities_Individually,
          Notes: 'Co-Occupant'
        };

        const newOccupants = [occ1, occ2];

        if (form.Booking_Type === 'Joint Group (3 People)') {
          const existingCo2 = existingOccs.filter(o => !o.Is_Primary)[1];

          // 2. Resolve or Create Tenant for Co-Occupant 2
          let co2TenantId = form.CoOccupant2_Tenant_ID;
          let matchedTenant2 = tenants.find(t => t.Tenant_ID === co2TenantId);
          if (!matchedTenant2 && form.CoOccupant2_Name.trim()) {
            matchedTenant2 = tenants.find(t =>
              t.Full_Name.toLowerCase() === form.CoOccupant2_Name.trim().toLowerCase() ||
              (form.CoOccupant2_Email && t.Email && t.Email.toLowerCase() === form.CoOccupant2_Email.trim().toLowerCase())
            );
          }

          if (matchedTenant2) {
            co2TenantId = matchedTenant2.Tenant_ID;
            const updatedT2: Tenant = {
              ...matchedTenant2,
              Current_Property_ID: form.Property_ID,
              Current_Unit_ID: form.Unit_ID,
              Current_Space_Name: `${form.Room_Name} (Co-Occupant)`,
              Status: 'Active'
            };
            storage.updateTenant(updatedT2, currentUser.Email);
          } else if (form.CoOccupant2_Name.trim()) {
            // Automatically register as a new Tenant in Tenants Directory!
            co2TenantId = 'TEN-' + Date.now().toString(36).toUpperCase() + '-2';
            const newTenant2: Tenant = {
              Tenant_ID: co2TenantId,
              Full_Name: form.CoOccupant2_Name.trim(),
              Email: form.CoOccupant2_Email.trim() || `${form.CoOccupant2_Name.trim().toLowerCase().replace(/\s+/g, '.')}@occupant.ca`,
              Phone: form.CoOccupant2_Phone.trim() || 'N/A',
              Emergency_Contact: `Lead Tenant: ${leadName}`,
              Status: 'Active',
              Current_Property_ID: form.Property_ID,
              Current_Unit_ID: form.Unit_ID,
              Current_Space_Name: `${form.Room_Name} (Co-Occupant)`,
              Created_At: new Date().toISOString().slice(0, 10),
              Notes: `Co-Occupant in ${form.Room_Name} (Joint lease with ${leadName}).`
            };
            storage.addTenant(newTenant2, currentUser.Email);
          }

          const occ3: RoomOccupant = {
            Occupant_ID: co2TenantId || existingCo2?.Occupant_ID || ('OCC-' + Date.now().toString(36) + '-2'),
            Full_Name: form.CoOccupant2_Name.trim(),
            Email: form.CoOccupant2_Email.trim() || undefined,
            Phone: form.CoOccupant2_Phone.trim() || undefined,
            Is_Primary: false,
            Utility_Share_Percentage: form.CoOccupant2_Share,
            Charge_Utilities_Individually: form.Charge_Utilities_Individually,
            Notes: 'Co-Occupant'
          };
          newOccupants.push(occ3);
        }

        occupants = newOccupants;
      } else {
        occupancyType = form.Booking_Type === 'Full Room' ? 'Full Room (1 Person)' : 'Single Bed';
        occupantsCount = 1;
        occupants = [
          {
            Occupant_ID: form.Tenant_ID,
            Full_Name: leadName,
            Email: leadTenant?.Email,
            Phone: leadTenant?.Phone,
            Is_Primary: true,
            Utility_Share_Percentage: 100,
            Charge_Utilities_Individually: false
          }
        ];
      }

      let spaceName = '';
      if (form.Booking_Type === 'Joint Group (2 People)') {
        spaceName = `${form.Room_Name} (Joint Room - ${leadName} & ${form.CoOccupant1_Name.trim()})`;
      } else if (form.Booking_Type === 'Joint Group (3 People)') {
        spaceName = `${form.Room_Name} (Joint Room - 3 Occupants: ${leadName}, ${form.CoOccupant1_Name.trim()}, ${form.CoOccupant2_Name.trim()})`;
      } else if (form.Booking_Type === 'Full Room') {
        spaceName = `${form.Room_Name} (Full Room Exclusive)`;
      } else {
        spaceName = `${form.Room_Name} - ${form.Bed_Slot} (Sharing)`;
      }

      const spaceId = isFull
        ? undefined
        : (form.Space_ID || `SPACE-U${form.Unit_ID}-R${form.Room_Index}-${form.Bed_Slot === 'Bed A' ? 'A' : 'B'}`);

      // Resolve parking spot name if selected
      const spotObj = selectedProperty?.Parking_Spots?.find(s => s.Spot_ID === form.Parking_Spot_ID);
      const parkingSpotName = form.Allot_Parking && spotObj ? spotObj.Spot_Number_Name : (form.Allot_Parking ? form.Parking_Spot_ID : undefined);

      if (editingLease) {
        const updated: Lease = {
          ...editingLease,
          Tenant_ID: form.Tenant_ID,
          Property_ID: form.Property_ID,
          Unit_ID: form.Unit_ID,
          Space_ID: spaceId,
          Space_Name: spaceName,
          Bedroom_ID: `BR-${form.Room_Index}`,
          Bedroom_Name: form.Room_Name,
          Is_Full_Bedroom: isFull,
          Is_Full_Room: false,
          Occupancy_Type: occupancyType,
          Occupants_Count: occupantsCount,
          Charge_Utilities_Individually: form.Charge_Utilities_Individually,
          Occupants: occupants,
          Lease_Start: form.Lease_Start,
          Lease_End: form.Lease_End,
          Monthly_Rent: form.Monthly_Rent,
          Deposit_Required: form.Deposit_Required,
          Security_Deposit_Amount: form.Deposit_Required,
          Security_Deposit: form.Deposit_Required,
          Last_Month_Rent: form.Last_Month_Rent,
          Last_Month_Rent_Amount: form.Last_Month_Rent,
          Status: form.Status,
          Utilities_Included: form.Utilities_Included,
          Parking_Spot_ID: form.Allot_Parking ? form.Parking_Spot_ID : undefined,
          Parking_Spot_Name: parkingSpotName,
          Parking_Fee: form.Allot_Parking ? form.Parking_Fee : undefined,
          Vehicle_Plate: form.Allot_Parking ? form.Vehicle_Plate : undefined,
          Notes: form.Notes
        };
        storage.updateLease(updated, currentUser.Email);

        // Update parking spot record in property if parking changed
        if (selectedProperty) {
          if (form.Allot_Parking && form.Parking_Spot_ID) {
            storage.assignParkingSpot(
              selectedProperty.Property_ID,
              form.Parking_Spot_ID,
              form.Tenant_ID,
              form.Vehicle_Plate || undefined,
              currentUser.Email
            );
          } else if (editingLease.Parking_Spot_ID && !form.Allot_Parking) {
            // Unassign previous parking spot
            storage.assignParkingSpot(
              selectedProperty.Property_ID,
              editingLease.Parking_Spot_ID,
              undefined,
              undefined,
              currentUser.Email
            );
          }
        }

        onToast(`Lease agreement ${updated.Lease_ID} updated successfully`, 'success');
      } else {
        const res = AccountingEngine.createLeaseWithCharges(
          {
            Tenant_ID: form.Tenant_ID,
            Property_ID: form.Property_ID,
            Unit_ID: form.Unit_ID,
            Space_ID: spaceId,
            Space_Name: spaceName,
            Bedroom_ID: `BR-${form.Room_Index}`,
            Bedroom_Name: form.Room_Name,
            Is_Full_Bedroom: isFull,
            Is_Full_Room: false,
            Occupancy_Type: occupancyType,
            Occupants_Count: occupantsCount,
            Charge_Utilities_Individually: form.Charge_Utilities_Individually,
            Occupants: occupants,
            Lease_Start: form.Lease_Start,
            Lease_End: form.Lease_End,
            Monthly_Rent: form.Monthly_Rent,
            Deposit_Required: form.Deposit_Required,
            Deposit_Received: 0,
            Last_Month_Rent: form.Last_Month_Rent,
            Drive_Folder_URL: `https://drive.google.com/drive/folders/lease-${form.Unit_ID.toLowerCase()}`,
            Notes: form.Notes,
            Utilities_Included: form.Utilities_Included,
            Parking_Spot_ID: form.Allot_Parking ? form.Parking_Spot_ID : undefined,
            Parking_Spot_Name: parkingSpotName,
            Parking_Fee: form.Allot_Parking ? form.Parking_Fee : undefined,
            Vehicle_Plate: form.Allot_Parking ? form.Vehicle_Plate : undefined
          },
          currentUser.Email
        );

        // Tag parking spot directly to tenant in property
        if (form.Allot_Parking && form.Parking_Spot_ID && selectedProperty) {
          storage.assignParkingSpot(
            selectedProperty.Property_ID,
            form.Parking_Spot_ID,
            form.Tenant_ID,
            form.Vehicle_Plate || undefined,
            currentUser.Email
          );
        }

        onToast(`Lease ${res.leaseId} created! Rent: $${form.Monthly_Rent}/mo for ${spaceName}.`, 'success');
      }
      setShowModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to process lease', 'error');
    }
  };

  const handleDeleteLeaseConfirm = () => {
    if (!deletingLease) return;
    // Release any tagged parking spot
    if (deletingLease.Parking_Spot_ID) {
      storage.assignParkingSpot(
        deletingLease.Property_ID,
        deletingLease.Parking_Spot_ID,
        undefined,
        undefined,
        currentUser.Email
      );
    }
    storage.deleteLease(deletingLease.Lease_ID, currentUser.Email);
    onToast(`Lease ${deletingLease.Lease_ID} deleted permanently`, 'info');
    setDeletingLease(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-600" />
            Lease Agreements & Room Allotments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add tenants to rooms/spaces with customized rent, utilities, and tagged parking spots.
          </p>
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
                <th className="py-3 px-4">Property & Suite</th>
                <th className="py-3 px-4">Space & Allocation</th>
                <th className="py-3 px-4">Utilities & Parking</th>
                <th className="py-3 px-4 text-right">Rent ($/mo)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No leases created yet. Click "Create New Lease" to initiate an agreement.
                  </td>
                </tr>
              ) : (
                leases.map(lease => (
                  <tr key={lease.Lease_ID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {lease.Lease_ID}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tenantName(lease.Tenant_ID)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {lease.Tenant_ID}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-bold text-slate-800">{unitName(lease.Unit_ID)}</div>
                      <div className="text-[11px] text-slate-500">{propertyName(lease.Property_ID)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {lease.Occupancy_Type?.includes('Joint') || (lease.Occupants && lease.Occupants.length > 1) ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            <Users className="w-3 h-3 text-purple-700" />
                            Joint Group ({lease.Occupants?.length || lease.Occupants_Count || 2} Occupants)
                          </span>
                          <div className="text-xs font-bold text-slate-800">
                            {lease.Bedroom_Name || 'Room'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {lease.Occupants?.map((occ, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                  occ.Is_Primary
                                    ? 'bg-purple-50 text-purple-800 border-purple-200 font-bold'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {occ.Full_Name} ({occ.Utility_Share_Percentage || 50}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : lease.Is_Full_Bedroom || lease.Is_Full_Room ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Bed className="w-3 h-3" />
                          {lease.Bedroom_Name || 'Full Room Exclusive'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Split className="w-3 h-3" />
                          {lease.Space_Name || 'Shared Bed Space'}
                        </span>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {lease.Lease_Start} to {lease.Lease_End || 'Ongoing'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      {lease.Utilities_Included !== false ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Zap className="w-2.5 h-2.5" /> Utilities Inc.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Metered Split
                        </span>
                      )}
                      {lease.Parking_Spot_ID && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 block w-fit">
                          <Car className="w-2.5 h-2.5" /> {lease.Parking_Spot_Name || lease.Parking_Spot_ID}
                          {lease.Parking_Fee ? ` (+$${lease.Parking_Fee})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {AccountingEngine.formatCurrency(lease.Monthly_Rent)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        lease.Status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lease.Status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveExpensesLease(lease)}
                          className="px-2 py-1 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="Manage Individual Utilities & Expenses"
                        >
                          <Receipt className="w-3 h-3 text-indigo-600" />
                          <span>Expenses ({lease.Individual_Expenses?.length || 0})</span>
                        </button>
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

      {/* CREATE / EDIT LEASE AGREEMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingLease ? `Edit Lease: ${editingLease.Lease_ID}` : 'Add Tenant Lease & Space Allotment'}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign available room space, set rent, configure utilities, and tag property parking
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLease} className="space-y-4 text-xs">
              {/* Tenant & Property Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Select Tenant *</label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {availablePrimaryTenants.length} unleased
                    </span>
                  </div>
                  <select
                    value={form.Tenant_ID}
                    onChange={(e) => setForm({ ...form, Tenant_ID: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    {availablePrimaryTenants.length === 0 ? (
                      <option value="" disabled>-- No Available Tenants (All Currently Leased) --</option>
                    ) : (
                      <>
                        {!form.Tenant_ID && <option value="">-- Select Available Tenant --</option>}
                        {availablePrimaryTenants.map(t => (
                          <option key={t.Tenant_ID} value={t.Tenant_ID}>
                            {t.Full_Name} ({t.Phone || t.Email || t.Tenant_ID})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Property *</label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {availableProperties.length} with vacancies
                    </span>
                  </div>
                  <select
                    value={form.Property_ID}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    {availableProperties.length === 0 ? (
                      <option value="" disabled>-- All Properties Fully Occupied --</option>
                    ) : (
                      availableProperties.map(p => (
                        <option key={p.Property_ID} value={p.Property_ID}>
                          {p.Property_Name} ({p.City})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Unit Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Unit / Suite *</label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {availableUnitsForSelectedProperty.length} vacant suite{availableUnitsForSelectedProperty.length === 1 ? '' : 's'}
                  </span>
                </div>
                <select
                  value={form.Unit_ID}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                >
                  {availableUnitsForSelectedProperty.length === 0 ? (
                    <option value="" disabled>-- No Vacant Units in Selected Property --</option>
                  ) : (
                    availableUnitsForSelectedProperty.map(u => (
                      <option key={u.Unit_ID} value={u.Unit_ID}>
                        {u.Unit_Number_Name || u.Unit_Number || u.Unit_ID} — {u.Bedrooms || 1} Rooms, {u.Bathrooms || 1} Baths {u.Division_Level ? `(${u.Division_Level})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* LIVE PROPERTY & UNIT OCCUPANCY SUMMARY BAR */}
              {unitOccupancy && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Dynamic Capacity & Vacancy Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      unitOccupancy.isFullyOccupied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {unitOccupancy.isFullyOccupied ? 'No Vacancies (0 Left)' : `${unitOccupancy.totalVacantSpaces} Space${unitOccupancy.totalVacantSpaces === 1 ? '' : 's'} Available`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-white rounded-lg p-2 border border-indigo-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Available Rooms</span>
                      <span className="font-bold text-slate-800">{unitOccupancy.roomsCount} Rooms</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dynamic Capacity</span>
                      <span className="font-bold text-purple-700">{unitOccupancy.totalCapacity} Tenants Max</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Currently Occupied</span>
                      <span className="font-bold text-emerald-700">{unitOccupancy.totalOccupied} Active Tenants</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-indigo-800 leading-relaxed">
                    💡 <strong>Vacancy Rule:</strong> When 4 spaces are filled in Rooms 1 & 2 and 1 room is leased whole to a tenant, total tenants becomes 5 (not 6) with 0 vacancy. If 5 spaces are filled, only 1 shared space remains; full room cannot be accommodated.
                  </p>
                </div>
              )}

              {/* ROOM & ALLOCATION SELECTION (Full Room vs. Sharing) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 text-indigo-600" />
                    Select Room & Allotment Mode *
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {unitOccupancy?.roomsCount || 1} Rooms in this Suite
                  </span>
                </div>

                {/* Rooms Selector Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {unitOccupancy?.rooms.map(rm => {
                    const isSelected = form.Room_Index === rm.roomIndex;
                    const isFullTaken = rm.isFullRoomOccupied || rm.occupiedSpacesCount === 2;
                    const isPartialTaken = rm.occupiedSpacesCount === 1 && !rm.isFullRoomOccupied;

                    return (
                      <button
                        key={rm.roomId}
                        type="button"
                        disabled={isFullTaken && editingLease?.Bedroom_ID !== rm.roomId}
                        onClick={() => handleRoomChange(rm.roomIndex)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isFullTaken
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : isPartialTaken
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-400'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{rm.roomName}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className={`text-[10px] mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {rm.isFullRoomOccupied
                            ? 'Whole Room Taken'
                            : rm.occupiedSpacesCount === 2
                            ? '2 Beds Occupied'
                            : isPartialTaken
                            ? `1 Space Left (${rm.availableBedSlot})`
                            : 'Vacant (Both Available)'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Booking Mode: Sharing Bed vs. Full Room vs. Joint Group */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 block text-xs">Booking Type for {form.Room_Name}:</span>
                    <span className="text-[10px] text-slate-500 font-medium">Tag 1 person, full room, or 2-3 group occupants</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Sharing Bed Space */}
                    <button
                      type="button"
                      onClick={() => handleBookingTypeChange('Sharing Bed')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.Booking_Type === 'Sharing Bed'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Split className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Individual Bed Space (Sharing)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        1 person takes 1 bed space. Room capacity remains 2 occupants.
                      </p>
                    </button>

                    {/* Option 2: Full Room Exclusive */}
                    <button
                      type="button"
                      disabled={isSelectedRoomPartialTaken}
                      onClick={() => handleBookingTypeChange('Full Room')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.Booking_Type === 'Full Room'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-950 ring-1 ring-purple-600'
                          : isSelectedRoomPartialTaken
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Home className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Full Room (1 Person Exclusive)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        {isSelectedRoomPartialTaken
                          ? '⚠️ Blocked: 1 bed space is already occupied.'
                          : 'Single tenant books the entire bedroom for exclusive private use.'}
                      </p>
                    </button>

                    {/* Option 3: Joint Group (2 People) */}
                    <button
                      type="button"
                      disabled={isSelectedRoomPartialTaken}
                      onClick={() => handleBookingTypeChange('Joint Group (2 People)')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.Booking_Type === 'Joint Group (2 People)'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600'
                          : isSelectedRoomPartialTaken
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Joint Group (2 People Tagged)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        {isSelectedRoomPartialTaken
                          ? '⚠️ Blocked: Room partially occupied.'
                          : 'Two people take one room tagged as one. Bill utilities individually.'}
                      </p>
                    </button>

                    {/* Option 4: Joint Group (3 People) */}
                    <button
                      type="button"
                      disabled={isSelectedRoomPartialTaken}
                      onClick={() => handleBookingTypeChange('Joint Group (3 People)')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.Booking_Type === 'Joint Group (3 People)'
                          ? 'border-amber-600 bg-amber-50/50 text-amber-950 ring-1 ring-amber-600'
                          : isSelectedRoomPartialTaken
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Joint Group (3 People Tagged)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        {isSelectedRoomPartialTaken
                          ? '⚠️ Blocked: Room partially occupied.'
                          : 'Three people take one room tagged as one. Bill utilities individually.'}
                      </p>
                    </button>
                  </div>

                  {/* Validation notice if user selects room with partial occupancy */}
                  {isSelectedRoomPartialTaken && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Room Sharing Notice:</strong> {form.Room_Name} already has 1 tenant in a bed space. You can only accommodate <strong>one space ({currentRoomOcc?.availableBedSlot || 'Bed B'})</strong> here; you cannot book a full room or joint group.
                      </div>
                    </div>
                  )}

                  {/* Bed Slot Selection (if Sharing Bed) */}
                  {form.Booking_Type === 'Sharing Bed' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                      <span className="font-semibold text-slate-600 text-xs">Assigned Bed Slot:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleBedSlotChange('Bed A')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs border ${
                            form.Bed_Slot === 'Bed A'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Bed A (Space 1)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBedSlotChange('Bed B')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs border ${
                            form.Bed_Slot === 'Bed B'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Bed B (Space 2)
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Tag: {form.Space_Name}
                      </span>
                    </div>
                  )}

                  {/* JOINT GROUP OCCUPANTS & INDIVIDUAL EXPENSES CONFIGURATION */}
                  {(form.Booking_Type === 'Joint Group (2 People)' || form.Booking_Type === 'Joint Group (3 People)') && (
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-slate-800 text-xs">
                            Group Occupants & Individual Expense Split Settings
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          Tagged to {form.Room_Name} as 1 Group
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        Tag {form.Booking_Type === 'Joint Group (3 People)' ? 'three' : 'two'} people to this room together. Contract rent is for the room, while utilities and other expenses can be charged individually per occupant.
                      </p>

                      <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {/* Primary Occupant (Lead Tenant) */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] inline-flex items-center justify-center font-bold">1</span>
                              Primary Tenant (Lead Occupant):
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {tenantName(form.Tenant_ID)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Contact</span>
                              <span className="font-medium text-slate-700">
                                {tenants.find(t => t.Tenant_ID === form.Tenant_ID)?.Phone || 'Phone on file'}
                              </span>
                            </div>
                            <div>
                              <label className="text-slate-500 block text-[10px] font-semibold">Utility Share (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={form.Primary_Share}
                                onChange={(e) => setForm({ ...form, Primary_Share: parseFloat(e.target.value) || 0 })}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Co-Occupant 2 */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] inline-flex items-center justify-center font-bold">2</span>
                              Co-Occupant 2 (Tagged to Room) *
                            </span>
                            {form.CoOccupant1_Tenant_ID ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Linked Tenant: {form.CoOccupant1_Tenant_ID}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Auto-creates new Tenant in Directory
                              </span>
                            )}
                          </div>

                          {/* Select from existing Tenants dropdown */}
                          <div>
                            <label className="text-slate-600 block text-[10px] font-bold mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-emerald-600" />
                                Select from Existing Tenants:
                              </span>
                              <span className="text-slate-400 font-normal text-[9px]">Pick from tenant directory or enter manual</span>
                            </label>
                            <select
                              value={form.CoOccupant1_Tenant_ID}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (!selectedId) {
                                  setForm({
                                    ...form,
                                    CoOccupant1_Tenant_ID: '',
                                    CoOccupant1_Name: '',
                                    CoOccupant1_Email: '',
                                    CoOccupant1_Phone: ''
                                  });
                                } else {
                                  const t = tenants.find(item => item.Tenant_ID === selectedId);
                                  if (t) {
                                    setForm({
                                      ...form,
                                      CoOccupant1_Tenant_ID: t.Tenant_ID,
                                      CoOccupant1_Name: t.Full_Name,
                                      CoOccupant1_Email: t.Email || '',
                                      CoOccupant1_Phone: t.Phone || ''
                                    });
                                  }
                                }
                              }}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-colors"
                            >
                              <option value="">-- Enter New Co-Occupant (Auto-creates in Tenants Directory) --</option>
                              <optgroup label="Available (Unleased) Tenants">
                                {availableCoOccupant1Tenants.map(t => (
                                  <option key={t.Tenant_ID} value={t.Tenant_ID}>
                                    {t.Full_Name} ({t.Tenant_ID}) {t.Phone ? `· ${t.Phone}` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="sm:col-span-1">
                              <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Full Name *</label>
                              <input
                                type="text"
                                placeholder="e.g., Alex Miller"
                                value={form.CoOccupant1_Name}
                                onChange={(e) => setForm({ ...form, CoOccupant1_Name: e.target.value })}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                                required
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Email / Interac</label>
                              <input
                                type="email"
                                placeholder="alex@example.ca"
                                value={form.CoOccupant1_Email}
                                onChange={(e) => setForm({ ...form, CoOccupant1_Email: e.target.value })}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Phone</label>
                              <input
                                type="text"
                                placeholder="Phone"
                                value={form.CoOccupant1_Phone}
                                onChange={(e) => setForm({ ...form, CoOccupant1_Phone: e.target.value })}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Utility Share (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={form.CoOccupant1_Share}
                                onChange={(e) => setForm({ ...form, CoOccupant1_Share: parseFloat(e.target.value) || 0 })}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Co-Occupant 3 (if 3 people) */}
                        {form.Booking_Type === 'Joint Group (3 People)' && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] inline-flex items-center justify-center font-bold">3</span>
                                Co-Occupant 3 (Tagged to Room) *
                              </span>
                              {form.CoOccupant2_Tenant_ID ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Linked Tenant: {form.CoOccupant2_Tenant_ID}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Auto-creates new Tenant in Directory
                                </span>
                              )}
                            </div>

                            {/* Select from existing Tenants dropdown */}
                            <div>
                              <label className="text-slate-600 block text-[10px] font-bold mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-amber-600" />
                                  Select from Existing Tenants:
                                </span>
                                <span className="text-slate-400 font-normal text-[9px]">Pick from tenant directory or enter manual</span>
                              </label>
                              <select
                                value={form.CoOccupant2_Tenant_ID}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  if (!selectedId) {
                                    setForm({
                                      ...form,
                                      CoOccupant2_Tenant_ID: '',
                                      CoOccupant2_Name: '',
                                      CoOccupant2_Email: '',
                                      CoOccupant2_Phone: ''
                                    });
                                  } else {
                                    const t = tenants.find(item => item.Tenant_ID === selectedId);
                                    if (t) {
                                      setForm({
                                        ...form,
                                        CoOccupant2_Tenant_ID: t.Tenant_ID,
                                        CoOccupant2_Name: t.Full_Name,
                                        CoOccupant2_Email: t.Email || '',
                                        CoOccupant2_Phone: t.Phone || ''
                                      });
                                    }
                                  }
                                }}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-colors"
                              >
                                <option value="">-- Enter New Co-Occupant (Auto-creates in Tenants Directory) --</option>
                                <optgroup label="Available (Unleased) Tenants">
                                  {availableCoOccupant2Tenants.map(t => (
                                    <option key={t.Tenant_ID} value={t.Tenant_ID}>
                                      {t.Full_Name} ({t.Tenant_ID}) {t.Phone ? `· ${t.Phone}` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                              <div className="sm:col-span-1">
                                <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Full Name *</label>
                                <input
                                  type="text"
                                  placeholder="e.g., Jordan Lee"
                                  value={form.CoOccupant2_Name}
                                  onChange={(e) => setForm({ ...form, CoOccupant2_Name: e.target.value })}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                                  required
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Email / Interac</label>
                                <input
                                  type="email"
                                  placeholder="jordan@example.ca"
                                  value={form.CoOccupant2_Email}
                                  onChange={(e) => setForm({ ...form, CoOccupant2_Email: e.target.value })}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Phone</label>
                                <input
                                  type="text"
                                  placeholder="Phone"
                                  value={form.CoOccupant2_Phone}
                                  onChange={(e) => setForm({ ...form, CoOccupant2_Phone: e.target.value })}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">Utility Share (%)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={form.CoOccupant2_Share}
                                  onChange={(e) => setForm({ ...form, CoOccupant2_Share: parseFloat(e.target.value) || 0 })}
                                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Individual Utilities Charging Option */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.Charge_Utilities_Individually}
                              onChange={(e) => setForm({ ...form, Charge_Utilities_Individually: e.target.checked })}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                            />
                            <span className="font-bold text-slate-800 text-[11px]">
                              Charge Utilities & Other Expenses Individually to each Occupant
                            </span>
                          </label>
                          <span className="text-[10px] text-slate-500">
                            Total Split: {Math.round((form.Primary_Share + form.CoOccupant1_Share + (form.Booking_Type === 'Joint Group (3 People)' ? form.CoOccupant2_Share : 0)) * 100) / 100}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RENT ASSIGNMENT FOR THIS TENANT */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-emerald-950 block">Rent for this Space / Tenant ($/mo) *</label>
                    <p className="text-[10px] text-emerald-700">
                      Rent is added directly when assigning the tenant to this space
                    </p>
                  </div>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      placeholder="0"
                      value={form.Monthly_Rent === 0 ? '' : form.Monthly_Rent}
                      onChange={(e) => {
                        const r = parseFloat(e.target.value) || 0;
                        setForm(prev => ({
                          ...prev,
                          Monthly_Rent: r
                        }));
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl font-extrabold text-sm text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-200/60 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Security / Key Deposit ($)</label>
                    <input
                      type="number"
                      value={form.Deposit_Required}
                      onChange={(e) => setForm({ ...form, Deposit_Required: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Last Month Rent (LMR) ($)</label>
                    <input
                      type="number"
                      value={form.Last_Month_Rent}
                      onChange={(e) => setForm({ ...form, Last_Month_Rent: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* UTILITIES INCLUSION (CONFIGURED PER TENANT) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.Utilities_Included}
                      onChange={(e) => setForm({ ...form, Utilities_Included: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Utilities Included for this Tenant
                    </span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    form.Utilities_Included ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {form.Utilities_Included ? 'All-Inclusive Rent' : 'Metered / Split Billed'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {form.Utilities_Included
                    ? 'Hydro, Heat, Water & High-Speed Wi-Fi are included in this tenant\'s base monthly rent.'
                    : 'This tenant will be invoiced separately for their proportional share of monthly utility bills.'}
                </p>
              </div>

              {/* PARKING ALLOTMENT TAGGED TO TENANT WITH STRICT VALIDATION */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.Allot_Parking}
                      onChange={(e) => setForm({ ...form, Allot_Parking: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-blue-600" />
                      Tag Property Parking Spot to this Tenant
                    </span>
                  </label>

                  {parkingAvailability && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      parkingAvailability.availableSpots > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {parkingAvailability.assignedSpots} of {parkingAvailability.totalSpots} spots assigned
                    </span>
                  )}
                </div>

                {form.Allot_Parking && (
                  <div className="space-y-2.5 pt-1">
                    {/* Check if property has any spots */}
                    {!selectedProp?.Parking_Spots || selectedProp.Parking_Spots.length === 0 ? (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                        ⚠️ <strong>No Parking Spots Defined:</strong> This property has 0 parking spots configured. Please add parking spots to "{selectedProp?.Property_Name}" under Properties before allotting.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Select Available Spot *
                            </label>
                            <select
                              value={form.Parking_Spot_ID}
                              onChange={(e) => {
                                const sp = selectedProp.Parking_Spots?.find(s => s.Spot_ID === e.target.value);
                                setForm({
                                  ...form,
                                  Parking_Spot_ID: e.target.value,
                                  Parking_Spot_Name: sp?.Spot_Number_Name || e.target.value,
                                  Parking_Fee: sp?.Monthly_Fee || 50
                                });
                              }}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs"
                              required={form.Allot_Parking}
                            >
                              <option value="">-- Choose a Parking Spot --</option>
                              {selectedProp.Parking_Spots.map(s => {
                                const isAssignedOther = s.Status === 'Assigned' && s.Assigned_Tenant_ID !== form.Tenant_ID;
                                return (
                                  <option
                                    key={s.Spot_ID}
                                    value={s.Spot_ID}
                                    disabled={isAssignedOther}
                                  >
                                    {s.Spot_Number_Name} ({s.Spot_Type}) — {isAssignedOther ? `Allotted to ${s.Assigned_Tenant_Name || 'another tenant'}` : `Available ($${s.Monthly_Fee || 0}/mo)`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Vehicle Plate (Optional)
                            </label>
                            <input
                              type="text"
                              value={form.Vehicle_Plate}
                              onChange={(e) => setForm({ ...form, Vehicle_Plate: e.target.value.toUpperCase() })}
                              placeholder="e.g. BXYZ 491"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs uppercase"
                            />
                          </div>
                        </div>

                        {parkingAvailability && parkingAvailability.availableSpots === 0 && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900">
                            Notice: All property spots are currently assigned. Over-allotting will fail validation.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lease Start Date *</label>
                  <input
                    type="date"
                    value={form.Lease_Start}
                    onChange={(e) => setForm({ ...form, Lease_Start: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={form.Lease_End}
                    onChange={(e) => setForm({ ...form, Lease_End: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Special Clauses</label>
                <textarea
                  rows={2}
                  value={form.Notes}
                  onChange={(e) => setForm({ ...form, Notes: e.target.value })}
                  placeholder="Smoking policy, pet addendum, parking stall terms..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingLease ? 'Save Changes' : 'Create Lease & Assign Space'}
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
        warningMessage="Deleting this lease agreement will release the room/bed space and any tagged parking spot back to available inventory."
        onConfirm={handleDeleteLeaseConfirm}
        onCancel={() => setDeletingLease(null)}
      />

      {/* Individual Expenses & Utilities Modal for Co-Occupants */}
      {activeExpensesLease && (
        <IndividualExpensesModal
          lease={activeExpensesLease}
          onClose={() => setActiveExpensesLease(null)}
          onUpdate={() => {
            const refreshed = storage.getLeases().find(l => l.Lease_ID === activeExpensesLease.Lease_ID) || null;
            setActiveExpensesLease(refreshed);
          }}
          onToast={onToast}
          currentUserEmail={currentUser.Email}
        />
      )}
    </div>
  );
};
