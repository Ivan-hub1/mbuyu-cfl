import api from './api';
import type { QuoteRequest, QuoteStatus } from '../types';

export async function getAllQuotes(filterStatus?: QuoteStatus): Promise<QuoteRequest[]> {
  const url = filterStatus ? `/quotes?status=${filterStatus}` : '/quotes';
  const { data } = await api.get(url);
  return data;
}

export async function getQuoteByReference(reference: string): Promise<QuoteRequest> {
  const { data } = await api.get(`/quotes/${reference}`);
  return data;
}



export async function createQuote(
  payload: Omit<QuoteRequest, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<QuoteRequest> {
  const { data } = await api.post('/quotes', payload);
  return data;
}

// Extra fields the API adds to quote save/accept responses
export interface EmailResult {
  _emailSent?: boolean;
  _emailError?: string | null;
}

export async function updateQuote(
  id: string,
  patch: Partial<QuoteRequest> & { sendEmailToCustomer?: boolean }
): Promise<QuoteRequest & EmailResult> {
  const { data } = await api.patch(`/quotes/${id}`, patch);
  return data;
}

export const STATUS_COLOR: Record<QuoteStatus, string> = {
  NEW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  REVIEWING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  QUOTED: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  ACCEPTED: 'bg-green-500/15 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};