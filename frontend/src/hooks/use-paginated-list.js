'use client';

import { useEffect, useRef, useState } from 'react';

function queryFor(path) {
  return new URLSearchParams(path?.split('?')[1] ?? '');
}
function pagePath(path, limit, cursor) {
  const query = queryFor(path);
  query.set('limit', String(limit));
  query.delete('cursor');
  if (cursor) query.set('cursor', cursor);
  return `${path.split('?')[0]}?${query}`;
}

// As tabelas mantêm só a página atual. loadMore é reservado aos seletores de opções.
export function usePaginatedList(path, request, { mode = 'list', refreshKey = 0 } = {}) {
  const initialSize = Number(queryFor(path).get('limit')) || 20;
  const [navigation, setNavigation] = useState({ path, initialized: path != null, pageSize: initialSize, index: 0, cursors: [null], revision: 0 });
  const current = navigation.path === path ? navigation : { ...navigation, path, initialized: navigation.initialized || path != null, index: 0, cursors: [null], pageSize: navigation.initialized ? navigation.pageSize : initialSize };
  const cursor = mode === 'list' ? current.cursors[current.index] : null;
  const target = path == null ? null : mode === 'list' ? pagePath(path, current.pageSize, cursor) : path;
  const key = JSON.stringify([target, current.revision, refreshKey]);
  const empty = { key, items: [], data: null, nextCursor: null, loading: path != null, loadingMore: false, error: null };
  const [state, setState] = useState(empty);
  const generation = useRef(0), controller = useRef(null), busy = useRef(false);

  useEffect(() => {
    setNavigation(previous => previous.path === path ? previous : { ...previous, path, initialized: previous.initialized || path != null, index: 0, cursors: [null], pageSize: previous.initialized ? previous.pageSize : initialSize });
  }, [path, initialSize]);

  useEffect(() => {
    const abort = new AbortController(), version = ++generation.current;
    controller.current = abort;
    busy.current = false;
    if (target == null) return () => abort.abort();
    setState({ key, items: [], data: null, nextCursor: null, loading: true, loadingMore: false, error: null });
    request(target, { signal: abort.signal }).then(data => {
      const items = Array.isArray(data) ? data : data?.items;
      if (mode !== 'resource' && !Array.isArray(items)) throw new Error('A lista retornou dados inválidos.');
      const nextCursor = data?.pagination?.nextCursor ?? null;
      if (nextCursor && nextCursor === cursor) throw new Error('A paginação retornou uma página repetida. Atualize a lista.');
      if (!abort.signal.aborted && version === generation.current) setState({ key, data, items: items ?? [], nextCursor, loading: false, loadingMore: false, error: null });
    }).catch(error => {
      if (!abort.signal.aborted && version === generation.current) setState({ key, items: [], data: null, nextCursor: null, loading: false, loadingMore: false, error: error.message });
    });
    return () => abort.abort();
  }, [key, target, request, mode, cursor]);

  const visible = state.key === key && path != null ? state : empty;
  const items = mode === 'finite' ? visible.items.slice(current.index * current.pageSize, (current.index + 1) * current.pageSize) : visible.items;
  const hasNext = mode === 'finite' ? (current.index + 1) * current.pageSize < visible.items.length : Boolean(visible.nextCursor);

  function goToPage(page) {
    if (visible.loading || visible.loadingMore || !Number.isInteger(page) || page < 1) return;
    if (mode === 'finite') {
      if (page > Math.max(1, Math.ceil(visible.items.length / current.pageSize))) return;
      setNavigation({ ...current, index: page - 1 });
      return;
    }
    if (page > current.index + 2 || (page === current.index + 2 && !hasNext) || (page <= current.index + 1 && page > current.cursors.length)) return;
    const cursors = page === current.index + 2 ? [...current.cursors.slice(0, current.index + 1), visible.nextCursor] : current.cursors;
    setNavigation({ ...current, index: page - 1, cursors });
  }
  function setPageSize(size) {
    if (![10, 20, 50, 100].includes(size) || visible.loadingMore) return;
    setNavigation({ ...current, pageSize: size, index: 0, cursors: [null] });
  }
  function reload() {
    setNavigation({ ...current, index: 0, cursors: [null], revision: current.revision + 1 });
  }
  async function loadMore() {
    if (mode !== 'list' || target == null || busy.current || visible.loading || !visible.nextCursor) return;
    const abort = controller.current, version = generation.current, nextCursor = visible.nextCursor;
    busy.current = true;
    setState(value => ({ ...value, loadingMore: true, error: null }));
    try {
      const data = await request(pagePath(path, current.pageSize, nextCursor), { signal: abort.signal });
      if (!Array.isArray(data?.items) || data.pagination?.nextCursor === nextCursor) throw new Error('Não foi possível carregar as próximas opções.');
      if (!abort.signal.aborted && version === generation.current) setState(value => ({ ...value, items: [...value.items, ...data.items], data, nextCursor: data.pagination?.nextCursor ?? null, loadingMore: false }));
    } catch (error) {
      if (!abort.signal.aborted && version === generation.current) setState(value => ({ ...value, loadingMore: false, error: error.message }));
    } finally { if (version === generation.current) busy.current = false; }
  }
  return { ...visible, items, hasNext, ...(mode === 'finite' && { total: visible.items.length }), page: current.index + 1, pageSize: current.pageSize, visitedPages: mode === 'finite' ? Math.max(1, Math.ceil(visible.items.length / current.pageSize)) : current.cursors.length,
    goToPage, setPageSize, nextPage: () => goToPage(current.index + 2), previousPage: () => goToPage(current.index), reload, loadMore };
}

// Somente coleções pequenas e delimitadas pelo domínio (resumos e seções fixas).
export function useLocalPagination(items, { initialPageSize = 20, loading = false } = {}) {
  const [pageSize, setSize] = useState(initialPageSize), [selectedPage, setPage] = useState(1);
  const visitedPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(selectedPage, visitedPages);
  const goToPage = value => { if (Number.isInteger(value) && value >= 1 && value <= visitedPages) setPage(value); };
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, loading, total: items.length, visitedPages, hasNext: page < visitedPages,
    goToPage, previousPage: () => goToPage(page - 1), nextPage: () => goToPage(page + 1),
    setPageSize(value) { if ([5, 10, 20, 50, 100].includes(value)) { setSize(value); setPage(1); } } };
}
