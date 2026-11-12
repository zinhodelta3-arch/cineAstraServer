"use client";

import { useEffect, useState } from "react";
import { SESSION_CHANGE_EVENT } from "@/lib/auth/session-events.mjs";

export const STREAMING_ACCESS_CHANGE_EVENT = "cineastra-streaming-access-change";
const RECHECK_MS = 30000;

export default function useStreamingAccess(user) {
  const userId = user?.id;
  const client = user?.role === "CLIENTE";
  const [access, setAccess] = useState(null);

  useEffect(() => {
    if (!client || !userId) return;
    let controller;
    let lastCheck = 0;
    let expiryTimer;

    async function load() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      lastCheck = Date.now();
      clearTimeout(expiryTimer);
      try {
        let cursor = "0";
        let expiresAt = 0;
        const visited = new Set();
        const today = new Date().toISOString().slice(0, 10);
        do {
          if (visited.has(cursor)) throw new Error("Paginação inválida.");
          visited.add(cursor);
          const response = await fetch(`/api/plans/mine?cursor=${encodeURIComponent(cursor)}`, {
            credentials: "same-origin", cache: "no-store", signal: request.signal,
          });
          if (!response.ok) throw new Error("Assinatura indisponível.");
          const data = await response.json();
          if (!Array.isArray(data.items)) throw new Error("Assinatura inválida.");
          for (const subscription of data.items) {
            if (subscription.status !== "ATIVA" || subscription.contract?.catalogAccess !== true) continue;
            const start = subscription.startsOn?.slice(0, 10);
            const end = subscription.endsOn?.slice(0, 10);
            if (!start || !end || start > today || end < today) continue;
            const expiry = Date.parse(`${end}T00:00:00Z`) + 86400000;
            if (Number.isFinite(expiry)) expiresAt = Math.max(expiresAt, expiry);
          }
          const next = data.pagination?.nextCursor;
          if (next && next === cursor) throw new Error("Paginação inválida.");
          cursor = next;
        } while (cursor && !expiresAt);

        if (request.signal.aborted) return;
        const remaining = expiresAt - Date.now();
        setAccess({ userId, expiresAt: remaining > 0 ? expiresAt : 0 });
        if (remaining > 0) {
          expiryTimer = setTimeout(() => {
            if (Date.now() >= expiresAt) setAccess({ userId, expiresAt: 0 });
            void load();
          }, Math.min(remaining, 2147483647));
        }
      } catch {
        if (!request.signal.aborted) setAccess({ userId, expiresAt: 0 });
      }
    }

    const onFocus = () => { if (Date.now() - lastCheck >= RECHECK_MS) void load(); };
    void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener(SESSION_CHANGE_EVENT, load);
    window.addEventListener(STREAMING_ACCESS_CHANGE_EVENT, load);
    return () => {
      controller?.abort();
      clearTimeout(expiryTimer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(SESSION_CHANGE_EVENT, load);
      window.removeEventListener(STREAMING_ACCESS_CHANGE_EVENT, load);
    };
  }, [client, userId]);

  return Boolean(client && userId && access?.userId === userId && access.expiresAt > 0);
}
