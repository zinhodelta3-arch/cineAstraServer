"use client";

import { useState } from "react";
import { TICKET_TYPES, emptySelection, quantityOf, totalOf, updateQuantity, createOrder } from "@/components/checkout/ticket-state.mjs";

export default function useTicketSelection(session, onContinue) {
  const [selection, setSelection] = useState(emptySelection);
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const count = quantityOf(selection);
  const total = totalOf(selection);
  const seatCount = session.seats.length;
  const remaining = seatCount - count;
  const complete = remaining === 0;
  const selected = TICKET_TYPES.filter(({ id }) => selection[id] > 0);

  function change(id, delta) {
    setMessage("");
    setSelection((current) => updateQuantity(current, id, delta, seatCount));
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
  return { selection, info, message, submitting, imageFailed, count, total, seatCount, remaining, complete, selected, change, setInfo, continueOrder, failImage, closeInfo, changeInfoOpen };
}
