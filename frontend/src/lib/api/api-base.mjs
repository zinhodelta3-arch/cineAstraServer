export const DEFAULT_API_URL = 'http://backend.cineastra.10.189.87.231.sslip.io/api';

export function resolveApiBase(value) {
 const base = (value?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
 if (/^https?:\/\//.test(base) && new URL(base).pathname === '/') return `${base}/api`;
 return base;
}
