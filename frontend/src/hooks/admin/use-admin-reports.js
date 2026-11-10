'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useEffect, useState } from 'react';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function reportRequest(path, { signal } = {}) {
  const response = await sessionFetch(`/api/admin/reports/${path}`, { cache: 'no-store', credentials: 'same-origin', signal });
  return readSessionResponse(response);
}

export function useAdminReport(path) {
  return usePaginatedList(path, reportRequest, { mode: /^(audit|http)(\?|$)/.test(path ?? '') ? 'list' : 'resource' });
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
