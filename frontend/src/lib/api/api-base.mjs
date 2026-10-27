export const DEFAULT_API_URL = 'http://backend.cineastra.10.189.87.231.sslip.io/api';

// Accept both the backend domain and a base URL that already includes /api.
export function resolveApiBase(value) {
 const base = (value?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
 if (/^https?:\/\//.test(base)) {
  const url = new URL(base);
  if (url.pathname === '/') return `${base}/api`;
 }
 return base;
}
