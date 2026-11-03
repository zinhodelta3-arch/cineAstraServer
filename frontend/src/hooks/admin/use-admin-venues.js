"use client";

import { useEffect, useRef, useState } from "react";
import { readSessionResponse } from "@/lib/auth/session-response.mjs";

export async function venueRequest(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(`/api/admin/venues/${path}`, {
    method, cache: "no-store", credentials: "same-origin", signal,
    headers: body == null ? undefined : { "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  return readSessionResponse(response);
}

export function useAdminVenues(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, items: [], nextCursor: null, loading: false, loadingMore: false, error: null });
  const generation = useRef(0);
  const key = `${path ?? ""}:${revision}`;
  useEffect(() => {
    if (!path) return;
    const abort = new AbortController();
    const current = ++generation.current;
    setState({ key, items: [], nextCursor: null, loading: true, loadingMore: false, error: null });
    venueRequest(path, { signal: abort.signal }).then((data) => {
      if (!Array.isArray(data?.items)) throw new Error("A lista retornou dados inválidos.");
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: data.items, nextCursor: data.pagination?.nextCursor ?? null, loading: false, loadingMore: false, error: null });
    }).catch((error) => {
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: [], nextCursor: null, loading: false, loadingMore: false, error: error.message });
    });
    return () => abort.abort();
  }, [key, path]);
  const visible = state.key === key ? state : { key, items: [], nextCursor: null, loading: Boolean(path), loadingMore: false, error: null };
  async function loadMore() {
    if (!path || !visible.nextCursor || visible.loading || visible.loadingMore) return;
    const cursor = visible.nextCursor;
    const current = generation.current;
    setState((value) => ({ ...value, loadingMore: true, error: null }));
    try {
      const data = await venueRequest(`${path}${path.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`);
      if (!Array.isArray(data?.items) || data.pagination?.nextCursor === cursor) throw new Error("Não foi possível carregar mais registros.");
      if (current === generation.current) setState((value) => ({ ...value, items: [...value.items, ...data.items], nextCursor: data.pagination?.nextCursor ?? null, loadingMore: false }));
    } catch (error) { if (current === generation.current) setState((value) => ({ ...value, loadingMore: false, error: error.message })); }
  }
  return { ...visible, loadMore, reload: () => setRevision((value) => value + 1) };
}

export function useVenueActions(list) {
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  function open(type, item = null) { setError(""); setNotice(""); setDialog({ type, item }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try { await task(); setDialog(null); setNotice(message); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  return { dialog, error, setError, notice, pending, open, close, run };
}
