import api from './api';
import type { Statement, CustomerSummaryRow } from '../types/statements';

export const statementsApi = {
  /** Admin: list of all customers with summary */
  listCustomers: async (): Promise<CustomerSummaryRow[]> => {
    const { data } = await api.get('/statements/customers');
    return data;
  },

  /** Admin: full statement for one customer */
  forCustomer: async (email: string): Promise<Statement> => {
    const { data } = await api.get(
      `/statements/customer/${encodeURIComponent(email)}`
    );
    return data;
  },

  /** Customer: their own statement */
  mine: async (): Promise<Statement> => {
    const { data } = await api.get('/statements/my');
    return data;
  },
};