"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/use-session";
import { readSessionResponse } from "@/lib/auth/session-response.mjs";

const emptyQueue = { items: [], nextCursor: null, loading: true, loadingMore: false, error: null };
const emptyThread = { id: null, ticket: null, messages: [], nextCursor: null, loading: false, loadingMore: false, error: null };
const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

async function request(path = "", body, signal) {
  const response = await fetch(`/api/admin/support${path.startsWith("?") ? path : path ? `/${path}` : ""}`, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    credentials: "same-origin",
    signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readSessionResponse(response);
}

export function useAdminSupport() {
  const session = useSession();
  const [queue, setQueue] = useState(emptyQueue);
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
  const queueGeneration = useRef(0);
  const threadGeneration = useRef(0);
  const actionLock = useRef(false);

  useEffect(() => {
    const abort = new AbortController();
    const generation = ++queueGeneration.current;
    setQueue((current) => ({ ...current, loading: true, error: null }));
    request("", undefined, abort.signal).then((data) => {
      if (!Array.isArray(data.items)) throw new Error("A fila retornou dados inválidos.");
      if (!abort.signal.aborted && generation === queueGeneration.current) setQueue({ items: data.items, nextCursor: data.pagination?.nextCursor ?? null, loading: false, loadingMore: false, error: null });
    }).catch((cause) => {
      if (!abort.signal.aborted && generation === queueGeneration.current) setQueue((current) => ({ ...current, loading: false, loadingMore: false, error: cause.message }));
    });
    return () => abort.abort();
  }, [queueRevision]);

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

  const search = normalize(query.trim());
  const visibleTickets = queue.items.filter((ticket) =>
    (status === "Todos" || ticket.status === status) &&
    (!search || normalize(`${ticket.id} ${ticket.clientId} ${ticket.subject}`).includes(search))
  );

  function select(id) {
    if (actionLock.current) return;
    setSelectedId(id);
    setDraft("");
    setError("");
    setNotice("");
  }

  async function loadMoreQueue() {
    const cursor = queue.nextCursor;
    if (!cursor || queue.loading || queue.loadingMore) return;
    const generation = queueGeneration.current;
    setQueue((current) => ({ ...current, loadingMore: true, error: null }));
    try {
      const data = await request(`?cursor=${encodeURIComponent(cursor)}`);
      if (!Array.isArray(data.items) || data.pagination?.nextCursor === cursor) throw new Error("Não foi possível carregar mais chamados.");
      if (generation === queueGeneration.current) setQueue((current) => ({ ...current, items: [...current.items, ...data.items], nextCursor: data.pagination?.nextCursor ?? null, loadingMore: false }));
    } catch (cause) {
      if (generation === queueGeneration.current) setQueue((current) => ({ ...current, loadingMore: false, error: cause.message }));
    }
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
    draft, setDraft, pending, notice, error, send, loadMoreQueue, loadMoreMessages,
    refresh() { setQueueRevision((value) => value + 1); if (selectedId) setThreadRevision((value) => value + 1); },
    assign() { if (session.user?.id) run("assign", {}, "Chamado atribuído a você."); },
    resolve() { run("resolve", {}, "Chamado resolvido."); },
  };
}
