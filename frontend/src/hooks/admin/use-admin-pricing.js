'use client';

import { useEffect, useRef, useState } from 'react';
import { readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function pricingRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`/api/admin/pricing/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body)
  });
  if (response.status === 204) return null;
  if (method === 'GET' && ['parameters', 'promotions', 'coupons'].includes(path) && response.ok) {
    let data;
    try { data = await response.json(); }
    catch { throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`); }
    if (!Array.isArray(data)) throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`);
    return data;
  }
  return readSessionResponse(response);
}

export function usePricingList(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, items: [], loading: false, error: null });
  const generation = useRef(0);
  const key = `${path}:${revision}`;
  useEffect(() => {
    const abort = new AbortController(), current = ++generation.current;
    setState({ key, items: [], loading: true, error: null });
    pricingRequest(path, { signal: abort.signal }).then(data => {
      if (!Array.isArray(data)) throw new Error('A lista retornou dados inválidos.');
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: data, loading: false, error: null });
    }).catch(error => {
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: [], loading: false, error: error.message });
    });
    return () => abort.abort();
  }, [key, path]);
  const visible = state.key === key ? state : { key, items: [], loading: true, error: null };
  return { ...visible, reload: () => setRevision(value => value + 1) };
}
