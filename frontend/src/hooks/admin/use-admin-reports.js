'use client';

import { useEffect, useRef, useState } from 'react';
import { readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function reportRequest(path, { signal } = {}) {
  const response = await fetch(`/api/admin/reports/${path}`, { cache: 'no-store', credentials: 'same-origin', signal });
  return readSessionResponse(response);
}

export function useAdminReport(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, data: null, loading: false, loadingMore: false, error: null });
  const generation = useRef(0), key = `${path ?? ''}:${revision}`;
  useEffect(() => {
    if (!path) return;
    const abort = new AbortController(), current = ++generation.current;
    setState({ key, data: null, loading: true, loadingMore: false, error: null });
    reportRequest(path, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted && current === generation.current) setState({ key, data, loading: false, loadingMore: false, error: null });
    }).catch(error => { if (!abort.signal.aborted && current === generation.current) setState({ key, data: null, loading: false, loadingMore: false, error: error.message }); });
    return () => abort.abort();
  }, [key, path]);
  const visible = state.key === key ? state : { key, data: null, loading: Boolean(path), loadingMore: false, error: null };
  async function loadMore() {
    const cursor = visible.data?.pagination?.nextCursor;
    if (!path || !cursor || visible.loading || visible.loadingMore) return;
    const current = generation.current;
    setState(value => ({ ...value, loadingMore: true, error: null }));
    try {
      const data = await reportRequest(`${path}${path.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(cursor)}`);
      if (!Array.isArray(data?.items) || data.pagination?.nextCursor === cursor) throw new Error('Não foi possível carregar mais registros.');
      if (current === generation.current) setState(value => ({ ...value, data: { ...value.data, items: [...value.data.items, ...data.items], pagination: data.pagination }, loadingMore: false }));
    } catch (error) { if (current === generation.current) setState(value => ({ ...value, loadingMore: false, error: error.message })); }
  }
  return { ...visible, loadMore, reload: () => setRevision(value => value + 1) };
}

export function useReportRange() {
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [applied, setApplied] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    const today = new Date(), start = new Date(today.getTime() - 29 * 86400000);
    const next = { from: start.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    setFrom(next.from); setTo(next.to); setApplied(next);
  }, []);
  function commit() {
    const start = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || !Number.isFinite(start) || !Number.isFinite(end) || new Date(start).toISOString().slice(0, 10) !== from || new Date(end).toISOString().slice(0, 10) !== to || from < '1000-01-01' || to > '9999-12-30' || end < start || end - start > 366 * 86400000) { setError('Escolha um período válido de até 366 dias.'); return false; }
    setError(''); setApplied({ from, to }); return true;
  }
  return { from, to, setFrom, setTo, applied, error, commit };
}
