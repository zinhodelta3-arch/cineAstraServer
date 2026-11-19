"use client";

import { useState } from "react";
import { ticketTypes, emptySelection, quantityOf, totalOf, updateQuantity, createOrder } from "@/components/checkout/ticket-state.mjs";

export default function useTicketSelection(session, onContinue) {
  const [selection, setSelection] = useState(emptySelection);
  const [halfDeclared, setHalfDeclared] = useState(false);
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
  const needsDeclaration = selected.some(type => type.category === "half");

  function change(id, delta) {
    setMessage("");
    if (types.some(type => type.id === id)) setSelection((current) => updateQuantity(current, id, delta, seatCount));
  }

  async function continueOrder() {
    if (!complete || submitting || (needsDeclaration && !halfDeclared)) return;
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
  return { halfDeclared, setHalfDeclared, needsDeclaration, types, selection, info, message, submitting, imageFailed, count, total, seatCount, remaining, complete, selected, change, setInfo, continueOrder, failImage, closeInfo, changeInfoOpen };
}
