'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function streamingAdminRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/admin/streaming/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body)
  });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useAdminStreaming(path) {
  return usePaginatedList(path, streamingAdminRequest);
}
