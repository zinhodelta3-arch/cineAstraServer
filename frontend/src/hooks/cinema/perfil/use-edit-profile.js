"use client";

import { useState } from "react";

export default function useEditProfile(profile, onSave) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const change = (field, value) => setDraft((previous) => ({ ...previous, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) { setError("Preencha seu nome e e-mail."); return; }
    if (draft.phone && draft.phone.replace(/\D/g, "").length < 10) { setError("Informe um telefone com DDD ou deixe o campo vazio."); return; }
    onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() }); setOpen(false);
  }
  const changeOpen = (isOpen) => { if (isOpen) { setDraft(profile); setError(""); } setOpen(isOpen); };

  return { open, draft, error, change, submit, changeOpen };
}
