'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function peopleRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await sessionFetch(`/api/admin/people/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return readSessionResponse(response);
}

export function useAdminPeople(path) {
  return usePaginatedList(path, peopleRequest);
}
