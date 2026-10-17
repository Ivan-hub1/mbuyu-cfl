// ─── Orders (legacy) ──────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'CUSTOMS'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  note?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  pickupAddress: string;
  dropoffAddress: string;
  events: TrackingEvent[];
  createdAt: string;
}

// ─── Quote Request ────────────────────────────────────────
export type QuoteStatus = 'NEW' | 'REVIEWING' | 'QUOTED' | 'ACCEPTED' | 'REJECTED';

export interface QuoteRequest {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;

  // Contact
  fullName: string;
  companyName?: string | null;
  email: string;
  phone: string;
  preferredContact: string;

  // Shipment
  cargoType: string;
  transportMode: string;
  weightKg: string;
  volumeCbm?: string | null;
  pieces: string;
  cargoDescription: string;
  cargoValue?: string | null;
  cargoValueCurrency?: string | null;

  // Route
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  shippingDate: string;
  incoterms: string;

  // Extras
  specialRequirements?: string | null;
  hasDocuments: boolean;

  // Admin response
  quotedAmount?: string | null;
  quotedCurrency?: string | null;
  adminResponse?: string | null;
  respondedAt?: string | null;

  // Tax (NEW)
  taxName?: string | null;
  taxRate?: string | null;
  taxAmount?: string | null;

  // Link to shipment
  shipmentId?: string | null;
}

// ─── Shipment (Cargo Tracking) ────────────────────────────
export type ShipmentStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_CUSTOMS'
  | 'CUSTOMS_HOLD'
  | 'CUSTOMS_CLEARED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';

export interface ShipmentEvent {
  id: string;
  shipmentId?: string;
  status: ShipmentStatus;
  location: string;
  note?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface ShipmentDocument {
  id: string;
  shipmentId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  reference?: string | null;

  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;

  description: string;
  cargoType: string;
  weightKg: string;
  volumeCbm?: string | null;
  pieces: string;

  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;

  status: ShipmentStatus;

  events?: ShipmentEvent[];
  documents?: ShipmentDocument[];

  _count?: {
    events: number;
    documents: number;
  };

  createdAt: string;
  updatedAt: string;
}