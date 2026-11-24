'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function salesRequest(path, { method = 'GET', body, signal, idempotencyKey } = {}) {
  const response = await sessionFetch(`/api/admin/sales/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: { ...(body == null ? {} : { 'Content-Type': 'application/json' }), ...(idempotencyKey ? { 'Idempotency-Key':idempotencyKey } : {}) },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return readSessionResponse(response);
}

export function useAdminSales(path, remember) {
  return usePaginatedList(path, salesRequest,{remember});
}
