export const DEFAULT_API_URL = 'http://backend.cineastra.10.189.87.231.sslip.io';

// Preserve the configured path; do not automatically append /api.
export function resolveApiBase(value) {
 return (value?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
}
