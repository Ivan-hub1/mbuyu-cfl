export interface StatementLine {
  id: string;
  date: string;
  type: 'quote' | 'shipment';
  reference: string;
  description: string;
  route: string;
  currency: string | null;
  amount: number | null;
  taxName: string | null;
  taxAmount: number | null;
  total: number | null;
  status: string;
  runningBalance: number;
}

export interface StatementSummary {
  currency: string;
  totalQuoted: number;
  totalInvoiced: number;
  outstandingBalance: number;
  quoteCount: number;
  shipmentCount: number;
}

export interface StatementCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  tinNumber?: string | null;
  ninNumber?: string | null;
  passportNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt?: string;
}

export interface Statement {
  customer: StatementCustomer;
  lines: StatementLine[];
  summary: StatementSummary;
}

export interface CustomerSummaryRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  createdAt: string;
  registrationCompleted: boolean;
  quoteCount: number;
  shipmentCount: number;
  totalBilled: number;
  currency: string;
}