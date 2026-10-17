export type StaffRole = 'HEAD_OFFICE' | 'DRIVER' | 'OPERATIONS';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'ON_TRIP'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type VehicleType = 'Truck' | 'Trailer' | 'Van' | 'Pickup' | 'Other';

export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  capacity: string | null;
  status: VehicleStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    checklists: number;
    journeys: number;
  };
}

export type ChecklistStatus =
  | 'SUBMITTED'
  | 'FLAGGED'
  | 'UNDER_REPAIR'
  | 'CLEARED'
  | 'APPROVED';

export interface Checklist {
  id: string;
  driverId: string;
  vehicleId: string;
  driverName: string;
  driverPermitNo: string;
  driverPermitClass: string;
  driverPermitExpiry: string;
  oilOk: boolean;
  waterOk: boolean;
  tyresOk: boolean;
  brakesOk: boolean;
  engineOk: boolean;
  lightsOk: boolean;
  hornOk: boolean;
  mirrorsOk: boolean;
  bodyOk: boolean;
  issuesNotes: string | null;
  status: ChecklistStatus;
  vehicle?: { id: string; plate: string; type: string };
  driver?: { id: string; name: string; email: string; phone?: string | null };
  maintenanceTickets?: MaintenanceTicket[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistFormData {
  vehicleId: string;
  driverName: string;
  driverPermitNo: string;
  driverPermitClass: string;
  driverPermitExpiry: string;
  oilOk: boolean;
  waterOk: boolean;
  tyresOk: boolean;
  brakesOk: boolean;
  engineOk: boolean;
  lightsOk: boolean;
  hornOk: boolean;
  mirrorsOk: boolean;
  bodyOk: boolean;
  issuesNotes?: string;
}

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface MaintenanceTicket {
  id: string;
  checklistId: string;
  issue: string;
  status: MaintenanceStatus;
  assignedToId: string | null;
  startedById: string | null;
  startedAt: string | null;
  photoBefore: string | null;
  photoBeforeTakenAt: string | null;
  photoAfter: string | null;
  photoAfterTakenAt: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  checklist?: Checklist;
  assignedTo?: { id: string; name: string; email: string } | null;
  startedBy?: { id: string; name: string; email: string } | null;
}

export type JourneyStatus =
  | 'NOT_STARTED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'ABORTED';

export type JourneyEventType =
  | 'STARTED'
  | 'CHECKPOINT'
  | 'STOP'
  | 'INCIDENT'
  | 'UPDATE'
  | 'RESUMED'
  | 'ENDED';

export interface JourneyEvent {
  id: string;
  journeyId: string;
  type: JourneyEventType;
  lat: number;
  lng: number;
  locationName: string | null;
  note: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string; role: string };
}

export interface Journey {
  id: string;
  driverId: string;
  vehicleId: string;
  checklistId: string | null;
  shipmentId: string | null;
  status: JourneyStatus;
  isPaused: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: { id: string; name: string; email: string; phone?: string };
  vehicle?: { id: string; plate: string; type: string };
  shipment?: {
    id: string;
    trackingNumber: string;
    customerEmail?: string;
    destinationCity?: string;
  };
  events?: JourneyEvent[];
  _count?: { events: number };
}

export interface StartJourneyData {
  vehicleId: string;
  checklistId: string;
  shipmentId?: string;
  lat: number;
  lng: number;
  locationName?: string;
}

export interface JourneyEventData {
  type: JourneyEventType;
  lat: number;
  lng: number;
  locationName?: string;
  note?: string;
}

export interface GeocodeResult {
  name: string;
  details?: {
    city: string | null;
    county: string | null;
    state: string | null;
    country: string | null;
    fullAddress: string | null;
  } | null;
  fallback?: boolean;
  cached?: boolean;
}