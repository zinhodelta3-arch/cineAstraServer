"use client";

import { useRef, useState } from "react";
import { formatBrl, priceForApi } from "@/lib/price-brl.mjs";

export default function MoneyInput({ name, defaultValue, required, disabled, maxWholeDigits = 8, onAmountChange }) {
  const submitted = useRef(null);
  const [initial] = useState(() => defaultValue == null || defaultValue === "" ? "" : formatBrl(defaultValue));

  function sync(input) {
    const value = priceForApi(input.value, maxWholeDigits);
    const invalid = input.value !== "" && value === null;
    input.setCustomValidity(invalid ? "Informe um valor em reais com até duas casas decimais. Ex.: R$ 25,90." : "");
    input.setAttribute("aria-invalid", String(invalid));
    submitted.current.value = value ?? "";
    onAmountChange?.(value);
    return value;
  }

  return <>
    <input type="text" data-money-field inputMode="decimal" placeholder="R$ 0,00" defaultValue={initial} maxLength={24}
      required={required} disabled={disabled} onChange={event => sync(event.currentTarget)}
      onBlur={event => {
        const input = event.currentTarget;
        const value = sync(input);
        if (value !== null) input.value = formatBrl(value);
      }} />
    <input type="hidden" name={name} ref={submitted} defaultValue={initial ? priceForApi(initial, maxWholeDigits) ?? "" : ""} disabled={disabled} />
  </>;
}
