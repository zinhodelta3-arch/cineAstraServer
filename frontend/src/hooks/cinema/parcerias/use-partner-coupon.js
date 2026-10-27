"use client";

import { useRef, useState } from "react";

export default function usePartnerCoupon(code) {
  const codeRef = useRef(null);
  const [status, setStatus] = useState('');

  async function copyCode() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setStatus('Código de demonstração copiado.');
    } catch {
      const selection = window.getSelection();
      if (selection && codeRef.current) {
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus('Copie o código selecionado com Ctrl+C ou pelo menu do celular.');
    }
  }

  return { codeRef, status, copyCode };
}
