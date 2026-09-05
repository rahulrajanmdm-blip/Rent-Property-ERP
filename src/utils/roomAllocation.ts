import { Property, Unit, Lease, Tenant, ParkingSpot } from '../types/erp';

export interface RoomOccupancyInfo {
  roomIndex: number;
  roomId: string;
  roomName: string;
  ensuiteBath?: boolean;
  isFullRoomOccupied: boolean;
  isJointRoom?: boolean; // 2 or 3 people taking the room as one
  occupantsCount?: number; // 1, 2, or 3
  occupantsList?: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
    email?: string;
    phone?: string;
    utilitySharePercentage?: number;
    chargeIndividually?: boolean;
  }>;
  occupantTenantIds: string[];
  occupantTenantNames: string[];
  occupiedSpacesCount: number; // 0, 1, 2, or 3
  capacity: number; // 1 if full room (1 person), 2 if shared/available or 2-person joint, 3 if 3-person joint
  vacantSpacesCount: number; // capacity - occupiedSpacesCount
  bedASpace: {
    id: string;
    name: string;
    isOccupied: boolean;
    tenantName?: string;
    tenantId?: string;
  };
  bedBSpace: {
    id: string;
    name: string;
    isOccupied: boolean;
    tenantName?: string;
    tenantId?: string;
  };
  canAccommodateFullRoom: boolean; // TRUE only if occupiedSpacesCount === 0!
  canAccommodateJointRoom: boolean; // TRUE only if occupiedSpacesCount === 0!
  canAccommodateSharingBed: boolean; // TRUE if occupiedSpacesCount < 2 && !isFullRoomOccupied
  availableBedSlot?: 'Bed A' | 'Bed B'; // Next available bed slot if 1 bed is taken
}

export interface UnitOccupancySummary {
  unitId: string;
  unitName: string;
  roomsCount: number;
  rooms: RoomOccupancyInfo[];
  totalCapacity: number; // Dynamic capacity based on full-room vs shared allocation
  totalOccupied: number; // Total active tenants in this unit
  totalVacantSpaces: number; // totalCapacity - totalOccupied
  fullRoomsAvailableCount: number; // Empty rooms eligible for full-room booking
  sharingBedsAvailableCount: number; // Available bed slots in shared rooms
  isFullyOccupied: boolean;
}

/**
 * Calculates accurate room occupancy, capacity, and vacancy for a unit.
 *
 * Validation Rules:
 * 1. A room can be shared (up to 2 bed spaces) OR leased fully to 1 tenant.
 * 2. If a tenant books a FULL ROOM: that room's capacity is 1 tenant (not 2).
 *    Total tenants in the property becomes 5 (not 6) when 4 spaces are filled + 1 full room.
 * 3. If a room already has 1 occupant in a shared bed (e.g. Bed A):
 *    That room CANNOT accommodate a full room! It can only accommodate 1 space (Bed B).
 * 4. When 5 spaces are filled in a 3-bedroom unit (4 in rooms 1 & 2, 1 in room 3):
 *    Only 1 space is left in that property. Full room cannot be accommodated.
 */
export function getUnitOccupancySummary(
  unit: Unit,
  activeLeases: Lease[],
  tenants: Tenant[] = []
): UnitOccupancySummary {
  const roomsCount = Math.max(1, unit.Bedrooms || 1);
  const tenantMap = new Map<string, string>();
  tenants.forEach(t => tenantMap.set(t.Tenant_ID, t.Full_Name));

  // Filter active leases belonging to this unit
  const unitLeases = activeLeases.filter(
    l => l.Unit_ID === unit.Unit_ID && (l.Status === 'Active' || (l.Status as string) === 'active')
  );

  const rooms: RoomOccupancyInfo[] = [];

  for (let r = 1; r <= roomsCount; r++) {
    const roomId = `BR-${r}`;
    const configuredBr = unit.Bedrooms_List?.find(
      b => b.Bedroom_ID === roomId || b.Bedroom_Name.toLowerCase() === `room ${r}` || b.Bedroom_Name.toLowerCase().startsWith(`room ${r} `)
    );
    const roomName = configuredBr?.Bedroom_Name || `Room ${r}`;
    const ensuiteBath = configuredBr?.Ensuite_Bath || false;

    // Find leases allocated to this specific room
    const leasesInRoom = unitLeases.filter(l => {
      if (l.Bedroom_ID === roomId || l.Bedroom_Name === roomName) return true;
      if (l.Space_Name && (
        l.Space_Name.toLowerCase().includes(`room ${r}`) ||
        l.Space_Name.toLowerCase().includes(roomName.toLowerCase())
      )) return true;
      if (l.Space_ID && l.Space_ID.toLowerCase().includes(`br${r}`)) return true;
      return false;
    });

    // Check if any lease is a Full Room / Full Bedroom or Joint Room lease
    const fullRoomLease = leasesInRoom.find(l =>
      l.Is_Full_Bedroom ||
      l.Is_Full_Room ||
      l.Occupancy_Type === 'Full Room (1 Person)' ||
      l.Occupancy_Type === 'Joint Room (2 People)' ||
      l.Occupancy_Type === 'Joint Room (3 People)' ||
      (l.Occupants && l.Occupants.length > 1)
    );

    let isFullRoomOccupied = false;
    let isJointRoom = false;
    let occupantsCount = 0;
    let occupiedSpacesCount = 0;
    let capacity = 2; // Default potential capacity (2 sharing spaces)
    const occupantTenantIds: string[] = [];
    const occupantTenantNames: string[] = [];
    const occupantsList: Array<{
      id: string;
      name: string;
      isPrimary: boolean;
      email?: string;
      phone?: string;
      utilitySharePercentage?: number;
      chargeIndividually?: boolean;
    }> = [];

    const bedASpace = {
      id: `${unit.Unit_ID}-BR${r}-BedA`,
      name: `${roomName} - Bed A`,
      isOccupied: false,
      tenantName: undefined as string | undefined,
      tenantId: undefined as string | undefined
    };

    const bedBSpace = {
      id: `${unit.Unit_ID}-BR${r}-BedB`,
      name: `${roomName} - Bed B`,
      isOccupied: false,
      tenantName: undefined as string | undefined,
      tenantId: undefined as string | undefined
    };

    if (fullRoomLease) {
      isFullRoomOccupied = true;
      const primaryName = tenantMap.get(fullRoomLease.Tenant_ID) || 'Active Tenant';
      occupantTenantIds.push(fullRoomLease.Tenant_ID);
      occupantTenantNames.push(primaryName);

      const isJoint = fullRoomLease.Occupancy_Type === 'Joint Room (2 People)' ||
                      fullRoomLease.Occupancy_Type === 'Joint Room (3 People)' ||
                      (fullRoomLease.Occupants && fullRoomLease.Occupants.length > 1);

      if (isJoint) {
        // Two or three people taking the same room as one group!
        isJointRoom = true;
        const totalPeople = fullRoomLease.Occupants_Count || fullRoomLease.Occupants?.length || 2;
        occupantsCount = totalPeople;
        capacity = totalPeople;
        occupiedSpacesCount = totalPeople;

        occupantsList.push({
          id: fullRoomLease.Tenant_ID,
          name: primaryName,
          isPrimary: true,
          chargeIndividually: fullRoomLease.Charge_Utilities_Individually ?? true
        });

        if (fullRoomLease.Occupants && fullRoomLease.Occupants.length > 0) {
          fullRoomLease.Occupants.forEach(occ => {
            if (!occ.Is_Primary && occ.Full_Name) {
              occupantTenantNames.push(occ.Full_Name);
              if (occ.Tenant_ID) occupantTenantIds.push(occ.Tenant_ID);
              occupantsList.push({
                id: occ.Occupant_ID || occ.Tenant_ID || `OCC-${occ.Full_Name}`,
                name: occ.Full_Name,
                isPrimary: false,
                email: occ.Email,
                phone: occ.Phone,
                utilitySharePercentage: occ.Utility_Share_Percentage,
                chargeIndividually: occ.Charge_Utilities_Individually ?? true
              });
            }
          });
        }

        bedASpace.isOccupied = true;
        bedASpace.tenantId = fullRoomLease.Tenant_ID;
        bedASpace.tenantName = primaryName;
        bedBSpace.isOccupied = true;
        const coNames = occupantTenantNames.slice(1).join(', ') || `${totalPeople - 1} Co-Occupants`;
        bedBSpace.tenantName = `Joint Group with ${coNames}`;
      } else {
        // Room is occupied by a single tenant exclusively!
        capacity = 1; // When a room is taken whole by 1 person, capacity is 1
        occupiedSpacesCount = 1;
        occupantsCount = 1;
        occupantsList.push({
          id: fullRoomLease.Tenant_ID,
          name: primaryName,
          isPrimary: true
        });
        bedASpace.isOccupied = true;
        bedASpace.tenantId = fullRoomLease.Tenant_ID;
        bedASpace.tenantName = primaryName;
        bedBSpace.isOccupied = true; // Blocked because room is full
        bedBSpace.tenantName = `Leased exclusively with Full Room (${primaryName})`;
      }
    } else {
      // Room is in shared mode
      leasesInRoom.forEach((l) => {
        const tName = tenantMap.get(l.Tenant_ID) || 'Active Tenant';
        occupantTenantIds.push(l.Tenant_ID);
        occupantTenantNames.push(tName);
        occupantsList.push({
          id: l.Tenant_ID,
          name: tName,
          isPrimary: true
        });

        // Check if lease explicitly targets Bed B
        const isBedB = (l.Space_Name && l.Space_Name.toLowerCase().includes('bed b')) ||
                       (l.Space_ID && l.Space_ID.toLowerCase().includes('bedb'));

        if (isBedB && !bedBSpace.isOccupied) {
          bedBSpace.isOccupied = true;
          bedBSpace.tenantId = l.Tenant_ID;
          bedBSpace.tenantName = tName;
        } else if (!bedASpace.isOccupied) {
          bedASpace.isOccupied = true;
          bedASpace.tenantId = l.Tenant_ID;
          bedASpace.tenantName = tName;
        } else if (!bedBSpace.isOccupied) {
          bedBSpace.isOccupied = true;
          bedBSpace.tenantId = l.Tenant_ID;
          bedBSpace.tenantName = tName;
        }
      });

      occupiedSpacesCount = (bedASpace.isOccupied ? 1 : 0) + (bedBSpace.isOccupied ? 1 : 0);
      capacity = 2;
      occupantsCount = occupiedSpacesCount;
    }

    const vacantSpacesCount = Math.max(0, capacity - occupiedSpacesCount);

    // Can only accommodate full room or joint room if room is completely EMPTY (0 occupants)
    const canAccommodateFullRoom = occupiedSpacesCount === 0 && !isFullRoomOccupied;
    const canAccommodateJointRoom = occupiedSpacesCount === 0 && !isFullRoomOccupied;

    // Can accommodate sharing bed if there is an empty bed
    const canAccommodateSharingBed = !isFullRoomOccupied && occupiedSpacesCount < 2;

    let availableBedSlot: 'Bed A' | 'Bed B' | undefined = undefined;
    if (canAccommodateSharingBed) {
      if (!bedASpace.isOccupied) availableBedSlot = 'Bed A';
      else if (!bedBSpace.isOccupied) availableBedSlot = 'Bed B';
    }

    rooms.push({
      roomIndex: r,
      roomId,
      roomName,
      ensuiteBath,
      isFullRoomOccupied,
      isJointRoom,
      occupantsCount,
      occupantsList,
      occupantTenantIds,
      occupantTenantNames,
      occupiedSpacesCount,
      capacity,
      vacantSpacesCount,
      bedASpace,
      bedBSpace,
      canAccommodateFullRoom,
      canAccommodateJointRoom,
      canAccommodateSharingBed,
      availableBedSlot
    });
  }

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + r.occupiedSpacesCount, 0);
  const totalVacantSpaces = Math.max(0, totalCapacity - totalOccupied);
  const fullRoomsAvailableCount = rooms.filter(r => r.canAccommodateFullRoom).length;
  const sharingBedsAvailableCount = rooms.reduce((sum, r) => sum + (r.canAccommodateSharingBed ? r.vacantSpacesCount : 0), 0);

  return {
    unitId: unit.Unit_ID,
    unitName: unit.Unit_Number_Name || unit.Unit_Number || unit.Unit_ID,
    roomsCount,
    rooms,
    totalCapacity,
    totalOccupied,
    totalVacantSpaces,
    fullRoomsAvailableCount,
    sharingBedsAvailableCount,
    isFullyOccupied: totalVacantSpaces === 0
  };
}

/**
 * Validates whether a requested room allocation is permitted.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateRoomAllocation(
  unit: Unit,
  activeLeases: Lease[],
  tenants: Tenant[],
  requestedRoomIndex: number,
  bookingMode: 'Single Bed' | 'Full Room (1 Person)' | 'Joint Room (2 People)' | 'Joint Room (3 People)' | boolean,
  editingLeaseId?: string
): { valid: boolean; reason?: string; availableBed?: 'Bed A' | 'Bed B' } {
  // Exclude current lease being edited if any
  const otherLeases = editingLeaseId
    ? activeLeases.filter(l => l.Lease_ID !== editingLeaseId)
    : activeLeases;

  const summary = getUnitOccupancySummary(unit, otherLeases, tenants);
  const targetRoom = summary.rooms.find(r => r.roomIndex === requestedRoomIndex);

  if (!targetRoom) {
    return { valid: false, reason: `Room ${requestedRoomIndex} does not exist in this unit.` };
  }

  const isJointRequested = bookingMode === 'Joint Room (2 People)' || bookingMode === 'Joint Room (3 People)';
  const isFullRoomRequested = bookingMode === true || bookingMode === 'Full Room (1 Person)';

  if (targetRoom.isFullRoomOccupied) {
    const groupType = targetRoom.isJointRoom
      ? `Joint Room Group (${targetRoom.occupantsCount || 2} occupants: ${targetRoom.occupantTenantNames.join(', ')})`
      : `Full Room (1 Person: ${targetRoom.occupantTenantNames.join(', ')})`;
    return {
      valid: false,
      reason: `${targetRoom.roomName} is already occupied by ${groupType}. No additional tenants can be accommodated in this room.`
    };
  }

  if (isJointRequested) {
    if (targetRoom.occupiedSpacesCount > 0) {
      return {
        valid: false,
        reason: `Cannot allocate Joint Room in ${targetRoom.roomName}: space is already occupied by ${targetRoom.occupantTenantNames.join(', ')}. Joint occupancy requires the entire room to be vacant to tag all occupants together as one.`
      };
    }
    return { valid: true };
  }

  if (isFullRoomRequested) {
    if (targetRoom.occupiedSpacesCount > 0) {
      const occupant = targetRoom.bedASpace.isOccupied ? targetRoom.bedASpace.tenantName : targetRoom.bedBSpace.tenantName;
      return {
        valid: false,
        reason: `Cannot accommodate Full Room in ${targetRoom.roomName}: ${occupant || 'Another tenant'} already occupies a bed space in this room. Only the remaining space (${targetRoom.availableBedSlot || '1 bed'}) can be accommodated.`
      };
    }
    return { valid: true };
  } else {
    // Shared bed requested
    if (targetRoom.occupiedSpacesCount >= 2) {
      return {
        valid: false,
        reason: `${targetRoom.roomName} is fully occupied (both Bed A and Bed B are filled).`
      };
    }
    return {
      valid: true,
      availableBed: targetRoom.availableBedSlot
    };
  }
}

/**
 * Parking Spot Availability & Validation
 */
export interface ParkingAvailabilitySummary {
  propertyId: string;
  propertyName: string;
  totalSpots: number;
  assignedSpots: number;
  availableSpots: number;
  spots: Array<{
    spotId: string;
    spotName: string;
    spotType: string;
    monthlyFee: number;
    status: 'Available' | 'Assigned';
    isAssigned: boolean;
    assignedTenantId?: string;
    assignedTenantName?: string;
    assignedUnitId?: string;
    vehiclePlate?: string;
  }>;
}

export function getPropertyParkingAvailability(
  property: Property,
  activeLeases: Lease[],
  tenants: Tenant[]
): ParkingAvailabilitySummary {
  const tenantMap = new Map<string, string>();
  tenants.forEach(t => tenantMap.set(t.Tenant_ID, t.Full_Name));

  const spotsList: ParkingSpot[] = property.Parking_Spots && property.Parking_Spots.length > 0
    ? property.Parking_Spots
    : [];

  // If property doesn't have explicit Parking_Spots array but has Total_Parking_Spots, synthesize
  const count = property.Total_Parking_Spots || spotsList.length || 0;
  const finalSpots = [...spotsList];

  while (finalSpots.length < count) {
    const idx = finalSpots.length + 1;
    finalSpots.push({
      Spot_ID: `PRK-${property.Property_ID.replace('PROP-', '')}-${idx}`,
      Spot_Number_Name: `Spot ${idx} - Driveway`,
      Spot_Type: 'Driveway',
      Monthly_Fee: 0,
      Status: 'Available'
    });
  }

  // Cross-reference with active leases that have Parking_Spot_ID
  const assignedSpotMap = new Map<string, { tenantId: string; tenantName: string }>();
  activeLeases.filter(l => l.Status === 'Active' && l.Parking_Spot_ID).forEach(l => {
    assignedSpotMap.set(l.Parking_Spot_ID!, {
      tenantId: l.Tenant_ID,
      tenantName: tenantMap.get(l.Tenant_ID) || 'Active Tenant'
    });
  });

  const spots = finalSpots.map(s => {
    const activeAssignment = assignedSpotMap.get(s.Spot_ID);
    const isAssigned = s.Status === 'Assigned' || !!s.Assigned_Tenant_ID || !!activeAssignment;
    const assignedTenantId = s.Assigned_Tenant_ID || activeAssignment?.tenantId;
    const assignedTenantName = s.Assigned_Tenant_Name || (assignedTenantId ? tenantMap.get(assignedTenantId) : undefined);

    return {
      spotId: s.Spot_ID,
      spotName: s.Spot_Number_Name || `Parking Spot`,
      spotType: s.Spot_Type || 'Driveway',
      monthlyFee: s.Monthly_Fee || 0,
      status: (isAssigned ? 'Assigned' : 'Available') as 'Available' | 'Assigned',
      isAssigned,
      assignedTenantId,
      assignedTenantName,
      assignedUnitId: s.Assigned_Unit_ID,
      vehiclePlate: s.Vehicle_Plate
    };
  });

  const assignedSpots = spots.filter(s => s.isAssigned).length;
  const availableSpots = Math.max(0, spots.length - assignedSpots);

  return {
    propertyId: property.Property_ID,
    propertyName: property.Property_Name,
    totalSpots: spots.length,
    assignedSpots,
    availableSpots,
    spots
  };
}

/**
 * Validates whether a parking spot can be assigned to a tenant.
 */
export function validateParkingAllotment(
  property: Property,
  spotId: string,
  tenantId: string,
  activeLeases: Lease[],
  tenants: Tenant[],
  currentAssignedSpotId?: string
): { valid: boolean; reason?: string } {
  // If tenant already has this spot assigned, it's valid to keep it
  if (currentAssignedSpotId && currentAssignedSpotId === spotId) {
    return { valid: true };
  }

  const parkingSummary = getPropertyParkingAvailability(property, activeLeases, tenants);
  const targetSpot = parkingSummary.spots.find(s => s.spotId === spotId);

  if (!targetSpot) {
    return {
      valid: false,
      reason: `Parking spot '${spotId}' does not exist on property ${property.Property_Name}.`
    };
  }

  if (targetSpot.isAssigned && targetSpot.assignedTenantId !== tenantId) {
    return {
      valid: false,
      reason: `Parking spot '${targetSpot.spotName}' is already allotted to ${targetSpot.assignedTenantName || 'another tenant'}. A property spot cannot be double-allotted.`
    };
  }

  return { valid: true };
}
