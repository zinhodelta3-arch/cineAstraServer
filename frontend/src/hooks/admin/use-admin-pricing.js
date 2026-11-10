'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function pricingRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/admin/pricing/${path}`, {
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
  return usePaginatedList(path, pricingRequest, { mode: path === 'parameters' ? 'finite' : 'list' });
}
