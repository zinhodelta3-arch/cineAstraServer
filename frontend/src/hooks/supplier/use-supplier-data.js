'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useEffect, useRef, useState } from 'react';
import { useTablePreference } from '@/hooks/use-table-preference';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function supplierRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/fornecedor/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body) });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useSupplierList(path, remember) {
  return usePaginatedList(path, supplierRequest,{remember});
}
export function useSupplierSearch(surface) {
  const [query, setQuery, ready] = useTablePreference(`fornecedor:${surface}:busca`, '');
  const [search, setSearch] = useState('');
  useEffect(()=>{
    if(!ready)return;
    const timer=setTimeout(()=>setSearch(String(query).trim().slice(0,120)),250);
    return()=>clearTimeout(timer);
  },[query,ready]);
  return {query,setQuery,search,ready,parameter:search?`&q=${encodeURIComponent(search)}`:''};
}

export function useSupplierLocations(enabled = true) {
  const grants = useSupplierList(enabled ? 'locations?limit=100&status=ATIVO' : null);
  const names = new Map(grants.items.map(row => [String(row.id_local), row.nome_local]));
  return { ...grants, name: id => id ? names.get(String(id)) ?? "Cinema vinculado" : '—' };
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
