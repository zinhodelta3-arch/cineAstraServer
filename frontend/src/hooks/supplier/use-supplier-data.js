'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useRef, useState } from 'react';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function supplierRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/fornecedor/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body) });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useSupplierList(path) {
  return usePaginatedList(path, supplierRequest);
}

export function useSupplierLocations() {
  const grants = useSupplierList('locations?limit=100&status=ATIVO');
  const names = new Map(grants.items.map(row => [String(row.id_local), row.nome_local]));
  return { ...grants, name: id => id ? names.get(String(id)) ?? `Cinema #${id}` : '—' };
}

export function useSupplierAction(reload) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  async function run(path, options, success) {
    if (lock.current) return false;
    lock.current = true; setPending(true); setError(''); setNotice('');
    try { await supplierRequest(path, options); setNotice(success); reload?.(); return true; }
    catch (cause) { setError(cause.message); return false; }
    finally { lock.current = false; setPending(false); }
  }
  return { run, pending, error, notice, setError };
}
