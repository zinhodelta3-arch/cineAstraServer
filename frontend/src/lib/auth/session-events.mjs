export const SESSION_CHANGE_EVENT = 'cineastra-session';
export const SESSION_CHANGE_KEY = 'cineastra:session-change';

export function notifySessionChange({ local = true } = {}) {
  try { window.localStorage.setItem(SESSION_CHANGE_KEY, String(Date.now())); }
  catch { /* A aba atual continua funcionando sem armazenamento. */ }
  if (local) window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}
