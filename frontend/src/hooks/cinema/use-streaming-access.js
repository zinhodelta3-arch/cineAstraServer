"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function useStreamingAccess(user) {
  const pathname = usePathname();
  const userId = user?.id;
  const client = user?.role === "CLIENTE";
  const [access, setAccess] = useState(null);

  useEffect(() => {
    if (!client || !userId) return;
    const controller = new AbortController();
    let generation = 0;
    let expiryTimer;

    async function load() {
      const current = ++generation;
      clearTimeout(expiryTimer);
      try {
        let cursor = "0";
        let expiresAt = 0;
        const today = new Date().toISOString().slice(0, 10);
        do {
          const response = await fetch(`/api/plans/mine?cursor=${encodeURIComponent(cursor)}`, {
            credentials: "same-origin", cache: "no-store", signal: controller.signal,
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

        if (controller.signal.aborted || current !== generation) return;
        setAccess({ userId, expiresAt });
        if (expiresAt > Date.now()) {
          expiryTimer = setTimeout(load, Math.min(expiresAt - Date.now(), 2147483647));
        }
      } catch {
        if (!controller.signal.aborted && current === generation) setAccess({ userId, expiresAt: 0 });
      }
    }

    load();
    window.addEventListener("focus", load);
    window.addEventListener("cineastra-session", load);
    return () => {
      controller.abort();
      clearTimeout(expiryTimer);
      window.removeEventListener("focus", load);
      window.removeEventListener("cineastra-session", load);
    };
  }, [client, userId, pathname]);

  return Boolean(client && userId && access?.userId === userId && access.expiresAt > Date.now());
}
