import axios from 'axios';
import { clearStoredSession } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Public company link ──────────────────────────────────
// Visitors arriving via ?company=<code> (e.g. /quote?company=acme) are
// sending quotes / registering with that company. Remembered for the tab.
const COMPANY_KEY = 'mbuyu_public_company';

export function publicCompany(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('company');
  if (fromUrl) {
    sessionStorage.setItem(COMPANY_KEY, fromUrl.toLowerCase().trim());
  }
  return sessionStorage.getItem(COMPANY_KEY);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mbuyu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const company = publicCompany();
    if (company) config.headers['X-Tenant'] = company;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A failed login attempt is also a 401 — let the login page show it
    const isLoginCall = err.config?.url?.startsWith('/auth/login');
    if (err.response?.status === 401 && !isLoginCall) {
      clearStoredSession();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
