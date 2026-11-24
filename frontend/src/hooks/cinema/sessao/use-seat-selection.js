"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/auth/use-session";
import { checkoutStorageKey, guestSeatKey, readCheckoutState } from "@/lib/api/checkout-storage.mjs";
import { cleanSeats, MAX_SEATS, toggleSeat } from "@/components/cinema/assentos/seat-state.mjs";

export function useSeatSelection(session) {
  const router = useRouter();
  const { user, loading } = useSession();
  const key = user ? checkoutStorageKey("session", user.id) : guestSeatKey;
  const [selected, setSelected] = useState(() => {
    try {
      const previous = JSON.parse(readCheckoutState(key) || "null");
      if (previous?.id === session.id) return cleanSeats(previous.seats, session.seatMap);
    } catch { /* Uma seleção inválida começa vazia. */ }
    return [];
  });
  const [error, setError] = useState("");
  const [continuing, setContinuing] = useState(false);

  function selectSeat(id) {
    if (continuing) return;
    if (!selected.includes(id) && selected.length >= MAX_SEATS) {
      setError(`Selecione no máximo ${MAX_SEATS} assentos por pedido.`);
      return;
    }
    setError("");
    setSelected((current) => toggleSeat(current, id, session.seatMap));
  }

  function continueToTickets() {
    if (!selected.length || continuing || loading) return;
    if (user && user.role !== "CLIENTE") {
      setError("Use uma conta de cliente para comprar ingressos.");
      return;
    }
    try {
      sessionStorage.setItem(key, JSON.stringify({ ...session, seats: selected }));
    } catch {
      setError("Não foi possível guardar os assentos. Permita o armazenamento neste navegador e tente novamente.");
      return;
    }
    setContinuing(true);
    router.push(user ? "/cinema/sessao/ingressos" : "/auth/login?next=%2Fcinema%2Fsessao%2Fingressos");
  }

  return { selected, error, continuing, checkingSession: loading, selectSeat, continueToTickets };
}
