"use client";

import { useMemo, useSyncExternalStore } from "react";
import { validSession } from "@/components/checkout/ticket-state.mjs";
import { useSession } from "@/hooks/auth/use-session";
import { checkoutStorageKey, readCheckoutState } from "@/lib/api/checkout-storage.mjs";

function serverSnapshot() {
  return null;
}

function subscribe(onChange) {
  function onStorage(event) {
    if (event.storageArea === window.sessionStorage) {
      onChange();
    }
  }
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function useCheckoutSession(fallback = null) {
  const { user, loading } = useSession();
  const key = !loading && user?.role === "CLIENTE" ? checkoutStorageKey("session", user.id) : null;
  const saved = useSyncExternalStore(subscribe, () => readCheckoutState(key), serverSnapshot);

  return useMemo(() => {
    try {
      const session = JSON.parse(saved || "null");
      return validSession(session) && Array.isArray(session.seatMap) && Number.isInteger(session.priceCents) && session.localId ? session : fallback;
    } catch {
      return fallback;
    }
  }, [saved, fallback]);
}
