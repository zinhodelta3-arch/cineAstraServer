'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useRef, useState } from 'react';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function supplyRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/admin/supply/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body)
  });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useAdminSupply(path) {
  return usePaginatedList(path, supplyRequest);
}

export function useSupplyActions(list) {
  const [dialog, setDialog] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [pending, setPending] = useState(false);
  const lock = useRef(false);
  function open(type, item = null) { setError(''); setNotice(''); setDialog({ type, item }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { await task(); setDialog(null); setNotice(message); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  return { dialog, error, setError, notice, pending, open, close, run };
}
