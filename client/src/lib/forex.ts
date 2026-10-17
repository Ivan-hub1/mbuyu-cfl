import api from './api';

export interface ForexRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
  cached?: boolean;
  fallback?: boolean;
}

export const SUPPORTED_CURRENCIES = [
  'UGX',
  'USD',
  'EUR',
  'KES',
  'TZS',
  'GBP',
  'AED',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

// ─── Fetch latest rates (cached server-side for 1hr) ──────
export async function fetchForexRates(): Promise<ForexRates> {
  const { data } = await api.get<ForexRates>('/forex/rates');
  return data;
}

// ─── Convert amount between two currencies ────────────────
// Rates are "how many base-units (UGX) per 1 unit of X"
// So: amountInUGX = amount * rate[X]
//     amountInY   = amountInUGX / rate[Y]
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>
): number {
  if (!rates || !rates[from] || !rates[to]) return 0;
  if (from === to) return amount;
  const amountInBase = amount * rates[from];
  return amountInBase / rates[to];
}

// ─── Format with thousands separators ─────────────────────
export function formatMoney(amount: number, currency: string): string {
  if (!isFinite(amount)) return `${currency} 0.00`;
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}