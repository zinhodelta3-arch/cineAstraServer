"use client";

import { useState } from "react";

export default function useProfilePassword(onSuccess) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirm")) { setError("As senhas precisam ser iguais."); return; }
    event.currentTarget.reset(); setOpen(false); onSuccess("Validação concluída. A senha não foi alterada: esta é uma demonstração.");
  }
  const changeOpen = (isOpen) => { setError(""); setOpen(isOpen); };

  return { open, error, submit, changeOpen };
}
