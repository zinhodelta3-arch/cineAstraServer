"use client";

import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/use-session";
import { sessionFetch, readSessionResponse } from "@/lib/auth/session-response.mjs";

const emptyThread = { id: null, ticket: null, messages: [], nextCursor: null, loading: false, loadingMore: false, error: null };

async function request(path = "", body, signal) {
  const response = await sessionFetch(`/api/admin/support${path.startsWith("?") ? path : path ? `/${path}` : ""}`, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    credentials: "same-origin",
    signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readSessionResponse(response);
}

const queueRequest = (path, { signal } = {}) => request(path, undefined, signal);

export function useAdminSupport() {
  const session = useSession();

  const [thread, setThread] = useState(emptyThread);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [queueRevision, setQueueRevision] = useState(0);
  const [threadRevision, setThreadRevision] = useState(0);

  const search = useDeferredValue(query.trim());
  const queue = usePaginatedList('?' + new URLSearchParams({ status: status === 'Todos' ? 'ALL' : status, limit: '50', ...(search ? { q: search } : {}) }), queueRequest, { refreshKey: queueRevision });
  const threadGeneration = useRef(0);
  const actionLock = useRef(false);


  useEffect(() => {
    if (!selectedId) return;
    const abort = new AbortController();
    const generation = ++threadGeneration.current;
    setThread((current) => current.id === selectedId ? { ...current, loading: true, error: null } : { ...emptyThread, id: selectedId, loading: true });
    Promise.all([request(selectedId, undefined, abort.signal), request(`${selectedId}/messages`, undefined, abort.signal)]).then(([ticket, history]) => {
      if (!ticket?.id || !Array.isArray(history.items)) throw new Error("A conversa retornou dados inválidos.");
      if (!abort.signal.aborted && generation === threadGeneration.current) setThread({ id: selectedId, ticket, messages: history.items, nextCursor: history.pagination?.nextCursor ?? null, loading: false, loadingMore: false, error: null });
    }).catch((cause) => {
      if (!abort.signal.aborted && generation === threadGeneration.current) setThread((current) => ({ ...current, loading: false, error: cause.message }));
    });
    return () => abort.abort();
  }, [selectedId, threadRevision]);

  const visibleTickets = queue.items;

  function select(id) {
    if (actionLock.current) return;
    setSelectedId(id);
    setDraft("");
    setError("");
    setNotice("");
  }


  async function loadMoreMessages() {
    const cursor = thread.nextCursor;
    if (!selectedId || !cursor || thread.loading || thread.loadingMore) return;
    const generation = threadGeneration.current;
    setThread((current) => ({ ...current, loadingMore: true, error: null }));
    try {
      const data = await request(`${selectedId}/messages?cursor=${encodeURIComponent(cursor)}`);
      if (!Array.isArray(data.items) || data.pagination?.nextCursor === cursor) throw new Error("Não foi possível carregar mais mensagens.");
      if (generation === threadGeneration.current) setThread((current) => ({ ...current, messages: [...current.messages, ...data.items], nextCursor: data.pagination?.nextCursor ?? null, loadingMore: false }));
    } catch (cause) {
      if (generation === threadGeneration.current) setThread((current) => ({ ...current, loadingMore: false, error: cause.message }));
    }
  }

  async function run(action, body, success) {
    if (!selectedId || actionLock.current) return;
    actionLock.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await request(`${selectedId}/${action}`, body);
      if (action === "resolve") {
        setSelectedId(null);
        setThread(emptyThread);
      }
      if (action === "messages") setDraft("");
      setNotice(success);
      setQueueRevision((value) => value + 1);
      if (action !== "resolve") setThreadRevision((value) => value + 1);
    } catch (cause) {
      setError(cause.message);
    } finally {
      actionLock.current = false;
      setPending(false);
    }
  }

  function send(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || message.length > 10000) return;
    run("messages", { message }, "Resposta enviada.");
  }

  return {
    session, queue, thread, selectedId, select, query, setQuery, status, setStatus, visibleTickets,
    draft, setDraft, pending, notice, error, send, loadMoreMessages,
    refresh() { setQueueRevision((value) => value + 1); if (selectedId) setThreadRevision((value) => value + 1); },
    assign() { if (session.user?.id) run("assign", {}, "Chamado atribuído a você."); },
    resolve() { run("resolve", {}, "Chamado resolvido."); },
  };
}
