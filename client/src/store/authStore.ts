import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  staffRole?: 'HEAD_OFFICE' | 'DRIVER' | 'OPERATIONS' | null;
  phone?: string | null;
}

// The company (tenant) the user belongs to
export interface Tenant {
  id: string;
  slug: string;
  name: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  login: (token: string, user: User, tenant?: Tenant | null) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export function clearStoredSession() {
  localStorage.removeItem('mbuyu_token');
  localStorage.removeItem('mbuyu_user');
  localStorage.removeItem('mbuyu_tenant');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('mbuyu_user') || 'null'),
  tenant: JSON.parse(localStorage.getItem('mbuyu_tenant') || 'null'),
  token: localStorage.getItem('mbuyu_token'),
  login: (token, user, tenant = null) => {
    localStorage.setItem('mbuyu_token', token);
    localStorage.setItem('mbuyu_user', JSON.stringify(user));
    localStorage.setItem('mbuyu_tenant', JSON.stringify(tenant));
    set({ token, user, tenant });
  },
  setUser: (user) => {
    localStorage.setItem('mbuyu_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    clearStoredSession();
    set({ token: null, user: null, tenant: null });
  },
}));
