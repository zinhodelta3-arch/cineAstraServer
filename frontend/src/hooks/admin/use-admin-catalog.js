"use client";

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { sessionFetch, readSessionResponse } from "@/lib/auth/session-response.mjs";
import { invalidateStreamingCatalog } from "@/lib/api/streaming-data.mjs";

export async function catalogRequest(path, { method = "GET", body, signal } = {}) {
  const multipart = body instanceof FormData;
  const response = await sessionFetch(`/api/admin/catalog/${path}`, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    signal,
    headers: body == null || multipart ? undefined : { "Content-Type": "application/json" },
    body: body == null ? undefined : multipart ? body : JSON.stringify(body) });
  const data = response.status === 204 ? null : await readSessionResponse(response);
  if (method !== "GET" && /^(films|genres)(?:\/|$)/.test(path)) invalidateStreamingCatalog();
  return data;
}

export function useAdminCatalogList(path) {
  return usePaginatedList(path, catalogRequest);
}
