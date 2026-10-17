import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  staffRole?: 'HEAD_OFFICE' | 'DRIVER' | 'OPERATIONS' | null;
  phone?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('mbuyu_user') || 'null'),
  token: localStorage.getItem('mbuyu_token'),
  login: (token, user) => {
    localStorage.setItem('mbuyu_token', token);
    localStorage.setItem('mbuyu_user', JSON.stringify(user));
    set({ token, user });
  },
  setUser: (user) => {
    localStorage.setItem('mbuyu_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('mbuyu_token');
    localStorage.removeItem('mbuyu_user');
    set({ token: null, user: null });
  },
}));