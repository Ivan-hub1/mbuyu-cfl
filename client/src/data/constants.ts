// ═══════════════════════════════════════════════════════════
// CARGO TYPES — reduced to major categories only
// ═══════════════════════════════════════════════════════════

export const CARGO_TYPES = [
  'General Cargo',
  'Dry Cargo',
  'Wet Cargo',
  'Container Cargo',
  'Bulk Cargo',
  'Perishables',
  'Vehicles & Machinery',
  'Other',
];

// ─── Wet Cargo sub-types ──────────────────────────────────
// Only shown when Cargo Type = "Wet Cargo"
export const WET_CARGO_VALUE = 'Wet Cargo';

export const WET_CARGO_SUBTYPES = [
  'PM (Petrol Motor Spirit)',
  'AGO (Automotive Gas Oil / Diesel)',
  'Kerosene',
];

// ═══════════════════════════════════════════════════════════
// TRANSPORT MODES
// ═══════════════════════════════════════════════════════════

export const TRANSPORT_MODES = [
  'Air Freight',
  'Sea Freight',
  'Road Freight',
  'Rail Freight',
  'Multimodal',
  'Not Sure',
];

// ═══════════════════════════════════════════════════════════
// INCOTERMS 2020
// ═══════════════════════════════════════════════════════════

export const INCOTERMS = [
  'EXW — Ex Works',
  'FCA — Free Carrier',
  'FAS — Free Alongside Ship',
  'FOB — Free On Board',
  'CFR — Cost and Freight',
  'CIF — Cost, Insurance and Freight',
  'CPT — Carriage Paid To',
  'CIP — Carriage and Insurance Paid To',
  'DAP — Delivered At Place',
  'DPU — Delivered at Place Unloaded',
  'DDP — Delivered Duty Paid',
  'Not Sure',
];

// ═══════════════════════════════════════════════════════════
// CURRENCIES
// ═══════════════════════════════════════════════════════════

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'UGX',
  'KES',
  'TZS',
  'RWF',
  'AED',
  'CNY',
  'ZAR',
];

// ═══════════════════════════════════════════════════════════
// CONTACT METHODS
// ═══════════════════════════════════════════════════════════

export const CONTACT_METHODS = [
  'Email',
  'Phone Call',
  'WhatsApp',
  'SMS',
];

// ═══════════════════════════════════════════════════════════
// OPTIONAL — Country tax rules (used elsewhere)
// ═══════════════════════════════════════════════════════════

export const COUNTRY_TAX_RULES: {
  country: string;
  taxName: string;
  rate: number;
}[] = [
  { country: 'Uganda', taxName: 'VAT', rate: 18 },
  { country: 'Kenya', taxName: 'VAT', rate: 16 },
  { country: 'Tanzania', taxName: 'VAT', rate: 18 },
  { country: 'Rwanda', taxName: 'VAT', rate: 18 },
  { country: 'Burundi', taxName: 'VAT', rate: 18 },
  { country: 'South Sudan', taxName: 'VAT', rate: 18 },
  { country: 'DR Congo', taxName: 'VAT', rate: 16 },
  { country: 'Ethiopia', taxName: 'VAT', rate: 15 },
  { country: 'Somalia', taxName: 'Sales Tax', rate: 10 },
  { country: 'Djibouti', taxName: 'VAT', rate: 10 },
  { country: 'United Arab Emirates', taxName: 'VAT', rate: 5 },
];

// ═══════════════════════════════════════════════════════════
// OPTIONAL — Country list shortcut (if used as plain strings)
// ═══════════════════════════════════════════════════════════

export const PREFERRED_CONTACT_OPTIONS = [
  { value: 'Email', label: 'Email' },
  { value: 'Phone', label: 'Phone Call' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
];

// ═══════════════════════════════════════════════════════════
// STATUS COLORS — used by various dashboard pages
// ═══════════════════════════════════════════════════════════

export const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  PICKED_UP: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_TRANSIT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  AT_CUSTOMS: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CUSTOMS_HOLD: 'bg-red-500/15 text-red-400 border-red-500/30',
  CUSTOMS_CLEARED: 'bg-green-500/15 text-green-400 border-green-500/30',
  OUT_FOR_DELIVERY: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  DELIVERED: 'bg-green-500/15 text-green-400 border-green-500/30',
  EXCEPTION: 'bg-red-500/15 text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  REVIEWING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  QUOTED: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  ACCEPTED: 'bg-green-500/15 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

// ═══════════════════════════════════════════════════════════
// SITE METADATA
// ═══════════════════════════════════════════════════════════

export const SITE_NAME = 'Mbuyu CFL';
export const SITE_TAGLINE = 'Clearing · Forwarding · Logistics';
export const SITE_EMAIL = 'operations@mbuyucfl.com';
export const SITE_PHONE = '+256 755 028 392';
export const SITE_WHATSAPP = '256755028392';
export const SITE_LOCATION = 'Kampala, Uganda';

// ═══════════════════════════════════════════════════════════
// SERVICE CATEGORIES (for public site display)
// ═══════════════════════════════════════════════════════════

export const SERVICES = [
  {
    icon: '🛃',
    title: 'Customs Clearing',
    desc: 'Fast, compliant clearance at all major ports and border posts.',
  },
  {
    icon: '🚢',
    title: 'Freight Forwarding',
    desc: 'Air, sea and road freight with competitive rates worldwide.',
  },
  {
    icon: '🏢',
    title: 'Warehousing',
    desc: 'Secure storage and distribution from our strategically located facilities.',
  },
  {
    icon: '🚚',
    title: 'Last-Mile Delivery',
    desc: 'Reliable door-to-door delivery with live tracking.',
  },
  {
    icon: '📡',
    title: 'Cargo Tracking',
    desc: 'FedEx-style visibility from pickup to delivery.',
  },
  {
    icon: '💼',
    title: 'Consulting',
    desc: 'Trade advisory, documentation and compliance support.',
  },
];