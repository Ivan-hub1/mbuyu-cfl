export type TransferReason =
  | 'BREAKDOWN'
  | 'ACCIDENT'
  | 'SECURITY_INCIDENT'
  | 'DRIVER_FATIGUE'
  | 'DRIVER_UNAVAILABLE'
  | 'ROUTE_BLOCKED'
  | 'OTHER';

export type CargoCondition =
  | 'INTACT'
  | 'PARTIALLY_DAMAGED'
  | 'MISSING_ITEMS'
  | 'MAJOR_DAMAGE'
  | 'UNKNOWN';

export interface TransferPayload {
  newDriverId: string;
  newVehicleId: string;
  reason: TransferReason;
  reasonNote?: string;
  cargoCondition: CargoCondition;
  cargoNotes?: string;
  missingItems?: string;
  damageNotes?: string;
  photoUrls?: string[];
  lat: number;
  lng: number;
  locationName?: string;
}

export interface ShipmentTransferRecord {
  id: string;
  shipmentId: string;
  oldJourneyId: string;
  newJourneyId: string | null;
  initiatedById: string;
  oldDriverId: string;
  newDriverId: string;
  newVehicleId: string;
  reason: TransferReason;
  reasonNote: string | null;
  cargoCondition: CargoCondition;
  cargoNotes: string | null;
  missingItems: string | null;
  damageNotes: string | null;
  photoUrls: string | null;
  lat: number;
  lng: number;
  locationName: string | null;
  createdAt: string;

  shipment?: {
    id: string;
    trackingNumber: string;
    customerName: string;
  };
  oldJourney?: {
    id: string;
    vehicle?: { plate: string; type: string };
  };
  newJourney?: {
    id: string;
    status: string;
    vehicle?: { plate: string; type: string };
  };
  oldDriver?: { id: string; name: string; email: string; phone?: string };
  newDriver?: { id: string; name: string; email: string; phone?: string };
  initiatedBy?: { id: string; name: string; role: string };
}

// Reason labels
export const TRANSFER_REASON_LABELS: Record<TransferReason, string> = {
  BREAKDOWN: 'Vehicle Breakdown',
  ACCIDENT: 'Road Accident',
  SECURITY_INCIDENT: 'Security Incident / Attack',
  DRIVER_FATIGUE: 'Driver Fatigue',
  DRIVER_UNAVAILABLE: 'Driver Unavailable',
  ROUTE_BLOCKED: 'Route Blocked',
  OTHER: 'Other',
};

export const CARGO_CONDITION_LABELS: Record<CargoCondition, string> = {
  INTACT: 'Intact — no visible issues',
  PARTIALLY_DAMAGED: 'Partially Damaged',
  MISSING_ITEMS: 'Missing Items',
  MAJOR_DAMAGE: 'Major Damage',
  UNKNOWN: 'Unknown — could not verify',
};