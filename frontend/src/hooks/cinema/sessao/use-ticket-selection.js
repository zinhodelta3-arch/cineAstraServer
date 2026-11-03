"use client";

import { useState } from "react";
import { ticketTypes, emptySelection, quantityOf, totalOf, updateQuantity, createOrder } from "@/components/checkout/ticket-state.mjs";

export default function useTicketSelection(session, onContinue) {
  const [selection, setSelection] = useState(() => ({ ...emptySelection(), inteira: session.priceCents != null ? session.seats.length : 0 }));
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const types = ticketTypes(session);
  const count = quantityOf(selection);
  const total = totalOf(selection, types);
  const seatCount = session.seats.length;
  const remaining = seatCount - count;
  const complete = remaining === 0;
  const selected = types.filter(({ id }) => selection[id] > 0);

  function change(id, delta) {
    setMessage("");
    if (types.some(type => type.id === id)) setSelection((current) => updateQuantity(current, id, delta, seatCount));
  }

  async function continueOrder() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      await onContinue(createOrder(session, selection));
    } catch (error) {
      setMessage(error?.message || "Não foi possível continuar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const failImage = () => setImageFailed(true);
  const closeInfo = () => setInfo(null);
  const changeInfoOpen = (open) => { if (!open) setInfo(null); };
  return { types, selection, info, message, submitting, imageFailed, count, total, seatCount, remaining, complete, selected, change, setInfo, continueOrder, failImage, closeInfo, changeInfoOpen };
}
