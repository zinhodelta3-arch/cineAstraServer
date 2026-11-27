"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/cart-provider";

const storageKey = "cineastra:cinema-location";
const changeEvent = "cineastra-cinema-location-change";
const CinemaLocationContext = createContext(null);
let sessionSelection = "";

function subscribe(onChange) {
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSelection() {
  try {
    return localStorage.getItem(storageKey) || "";
  } catch {
    return sessionSelection;
  }
}

function parseSelection(snapshot) {
  try {
    const row = JSON.parse(snapshot);
    if (typeof row?.id_local === "string" && /^[1-9]\d{0,9}$/.test(row.id_local) && Number(row.id_local) <= 4294967295
      && typeof row.nome === "string" && typeof row.cidade === "string") return row;
  } catch {
    // Uma preferência ausente ou inválida abre a programação geral.
  }
  return null;
}

export function CinemaLocationProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, readSelection, () => null);
  const location = parseSelection(snapshot);
  const { items, selectSnackLocation } = useCart();
  const [cartNotice, setCartNotice] = useState("");

  function selectCinema(row) {
    const next = row ? {
      id_local: String(row.id_local), nome: row.nome, cidade: row.cidade, estado: row.estado,
    } : null;
    const moved = next && items.some(item => ["INPUT", "COMBO"].includes(item.purchaseKind)
      && item.localId && item.localId !== next.id_local);
    const activeItems = next ? selectSnackLocation(next.id_local) : items;
    const notice = moved ? "Os lanches do carrinho foram guardados no cinema original. Selecione aquele cinema para recuperá-los." : "";
    sessionSelection = next ? JSON.stringify(next) : "";
    try { localStorage.setItem(storageKey, sessionSelection); } catch { /* Disponível durante a navegação desta aba. */ }
    setCartNotice(notice);
    window.dispatchEvent(new Event(changeEvent));
    return { activeItems, notice };
  }

  return (
    <CinemaLocationContext.Provider value={{ location, ready: snapshot !== null, selectCinema, cartNotice }}>
      {children}
    </CinemaLocationContext.Provider>
  );
}

export function useCinemaLocation() {
  return useContext(CinemaLocationContext);
}
