"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEMO_SESSION, validSession } from "@/components/checkout/ticket-state.mjs";

export const CHECKOUT_SESSION_KEY = "cineastra:checkout:session";

function readSnapshot() {
  try {
    // Mantém o snapshot como string estável, sem criar objetos a cada leitura.
    return window.sessionStorage.getItem(CHECKOUT_SESSION_KEY);
  } catch {
    return null;
  }
}

function serverSnapshot() {
  return null;
}

function subscribe(onChange) {
  function onStorage(event) {
    if (event.storageArea === window.sessionStorage &&
        (event.key === CHECKOUT_SESSION_KEY || event.key === null)) {
      onChange();
    }
  }
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function useCheckoutSession(fallback = DEMO_SESSION) {
  const saved = useSyncExternalStore(subscribe, readSnapshot, serverSnapshot);

  return useMemo(() => {
    try {
      const session = JSON.parse(saved || "null");
      return validSession(session) ? session : fallback;
    } catch {
      return fallback;
    }
  }, [saved, fallback]);
}
