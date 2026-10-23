"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKOUT_SESSION_KEY } from "./use-checkout-session";
import { cleanSeats, MAX_SEATS, toggleSeat } from "@/components/cinema/assentos/seat-state.mjs";

export function useSeatSelection(session) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => cleanSeats(session.seats));
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState("");
  const [continuing, setContinuing] = useState(false);

  function selectSeat(id) {
    if (continuing) return;
    if (!selected.includes(id) && selected.length >= MAX_SEATS) {
      setError(`Selecione no máximo ${MAX_SEATS} assentos por pedido.`);
      return;
    }
    setError("");
    setSelected((current) => toggleSeat(current, id));
  }

  function continueToTickets() {
    if (!selected.length || continuing) return;
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify({ ...session, seats: selected }));
    } catch {
      setError("Não foi possível guardar os assentos. Permita o armazenamento neste navegador e tente novamente.");
      return;
    }
    setContinuing(true);
    router.push("/cinema/sessao/ingressos");
  }

  return { selected, zoom, setZoom, error, continuing, selectSeat, continueToTickets };
}
