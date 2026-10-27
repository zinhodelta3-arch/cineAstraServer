"use client";

import { useState } from "react";

export default function useAddCard(onAdd) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const last4 = String(values.get("last4"));
    const expiry = String(values.get("expiry"));
    const [month, year] = expiry.split("/").map(Number);
    const now = new Date();
    if (!/^\d{4}$/.test(last4)) { setError("Informe exatamente os quatro últimos dígitos."); return; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) || new Date(2000 + year, month, 1) <= now) { setError("Informe uma validade futura no formato MM/AA."); return; }
    onAdd({ id: crypto.randomUUID(), brand: values.get("brand"), nickname: String(values.get("nickname")).trim() || "Meu cartão", last4, expiry }); setOpen(false);
  }
  const changeOpen = (isOpen) => { setError(""); setOpen(isOpen); };

  return { open, error, submit, changeOpen };
}
