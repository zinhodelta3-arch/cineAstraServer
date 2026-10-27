"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { publicGet } from '@/lib/api/public-api.mjs';
export function usePublicList(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, items: [], cursor: null, loading: true, error: null });
  const key = `${path}:${revision}`;
  const controller = useRef(null);
  const busy = useRef(false);
  useEffect(() => {
    if (!path) return;
    const abort = new AbortController(); controller.current = abort; busy.current = true;
    async function load() {
      try {
        const data = await publicGet(path, { signal: abort.signal });
        if (!Array.isArray(data.items) || !data.pagination) throw new Error('Resposta inválida do servidor.');
        if (!abort.signal.aborted) setState({ key, items: data.items, cursor: data.pagination.nextCursor, loading: false, error: null });
      } catch (error) { if (!abort.signal.aborted) setState({ key, items: [], cursor: null, loading: false, error: error.message }); }
      finally { if (!abort.signal.aborted) busy.current = false; }
    }
    load(); return () => abort.abort();
  }, [path, key]);
  const loadMore = useCallback(async () => {
    if (busy.current || !state.cursor || state.key !== key) return;
    const abort = controller.current; busy.current = true;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await publicGet(`${path}${path.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(state.cursor)}`, { signal: abort.signal });
      if (!Array.isArray(data.items) || !data.pagination || data.pagination.nextCursor === state.cursor) throw new Error('Paginação inválida. Tente atualizar a lista.');
      if (!abort.signal.aborted) setState(s => ({ ...s, items: [...s.items, ...data.items], cursor: data.pagination.nextCursor, loading: false }));
    } catch (error) { if (!abort.signal.aborted) setState(s => ({ ...s, loading: false, error: error.message })); }
    finally { if (!abort.signal.aborted) busy.current = false; }
  }, [path, key, state.cursor, state.key]);
  const visible = !path ? { items: [], cursor: null, loading: false, error: null } : state.key === key ? state : { items: [], cursor: null, loading: true, error: null };
  return { ...visible, loadMore, retry: () => setRevision(v => v + 1) };
}
