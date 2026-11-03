'use client';

import { useEffect, useRef, useState } from 'react';
import { readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function supplierRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`/api/fornecedor/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useSupplierList(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, items: [], nextCursor: null, loading: false, loadingMore: false, error: '' });
  const generation = useRef(0);
  const key = `${path ?? ''}:${revision}`;
  useEffect(() => {
    if (!path) return;
    const abort = new AbortController(), current = ++generation.current;
    setState({ key, items: [], nextCursor: null, loading: true, loadingMore: false, error: '' });
    supplierRequest(path, { signal: abort.signal }).then(data => {
      if (!Array.isArray(data?.items)) throw new Error('A lista retornou dados inválidos.');
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: data.items, nextCursor: data.pagination?.nextCursor ?? null, loading: false, loadingMore: false, error: '' });
    }).catch(error => {
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: [], nextCursor: null, loading: false, loadingMore: false, error: error.message });
    });
    return () => abort.abort();
  }, [key, path]);
  const visible = state.key === key ? state : { key, items: [], nextCursor: null, loading: Boolean(path), loadingMore: false, error: '' };
  async function loadMore() {
    if (!path || !visible.nextCursor || visible.loading || visible.loadingMore) return;
    const cursor = visible.nextCursor, current = generation.current;
    setState(value => ({ ...value, loadingMore: true, error: '' }));
    try {
      const data = await supplierRequest(`${path}${path.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(cursor)}`);
      if (!Array.isArray(data?.items) || data.pagination?.nextCursor === cursor) throw new Error('Não foi possível carregar mais registros.');
      if (current === generation.current) setState(value => ({ ...value, items: [...value.items, ...data.items], nextCursor: data.pagination?.nextCursor ?? null, loadingMore: false }));
    } catch (error) { if (current === generation.current) setState(value => ({ ...value, loadingMore: false, error: error.message })); }
  }
  return { ...visible, loadMore, reload: () => setRevision(value => value + 1) };
}

export function useSupplierLocations() {
  const grants = useSupplierList('locations?limit=100&status=ATIVO');
  const [names, setNames] = useState({});
  const ids = grants.items.map(row => row.id_local).join(',');
  useEffect(() => {
    if (!ids) return;
    const abort = new AbortController();
    const locationIds = ids.split(',');
    Promise.allSettled(locationIds.map(id => supplierRequest(`locations/${id}`, { signal: abort.signal }))).then(results => {
      if (abort.signal.aborted) return;
      setNames(Object.fromEntries(results.flatMap((result, index) => result.status === 'fulfilled' ? [[locationIds[index], result.value.nome]] : [])));
    });
    return () => abort.abort();
  }, [ids]);
  return { ...grants, name: id => id ? names[id] ?? `Cinema #${id}` : '—' };
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
