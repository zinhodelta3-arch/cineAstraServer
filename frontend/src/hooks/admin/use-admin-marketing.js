'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useRef, useState } from 'react';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function marketingRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/admin/marketing/${path}`, { method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) });
  return readSessionResponse(response);
}

export function useAdminMarketing(path) {
  return usePaginatedList(path, marketingRequest);
}

export function useMarketingActions(list) {
  const [dialog, setDialog] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [pending, setPending] = useState(false);
  const lock = useRef(false);
  function open(type, item = null) { setError(''); setDialog({ type, item }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message, after) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { const result = await task(); setDialog(null); setNotice(typeof message === 'function' ? message(result) : message); list.reload(); after?.(result); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  return { dialog, error, notice, pending, open, close, run, setError };
}
