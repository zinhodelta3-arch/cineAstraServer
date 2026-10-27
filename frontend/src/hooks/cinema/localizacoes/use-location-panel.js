"use client";

import { useMemo, useState, useRef, useEffect, useSyncExternalStore } from "react";

function readClock() { return Math.floor(Date.now() / 60000); }
function serverClock() { return null; }
function subscribeClock(onChange) {
  const timer = setInterval(onChange, 60000);
  return () => clearInterval(timer);
}

export function useLocationPanel(loc) {
  const days = useMemo(() => {
    const base = new Date();
    return [0, 1, 2, 3].map((i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      return {
        key: i,
        label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d).replace(".", ""),
        date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d).replace(".", ""),
      };
    });
  }, []);

  const [day, setDay] = useState(0);
  const minute = useSyncExternalStore(subscribeClock, readClock, serverClock);
  const clock = minute === null ? null : new Date(minute * 60000);
  const now = clock === null ? null : clock.getHours() * 60 + clock.getMinutes();
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef(null);
  useEffect(() => () => clearTimeout(copyTimeout.current), []);

  const fullAddress = `${loc.street}, ${loc.district}, CEP ${loc.cep}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(fullAddress); setCopied(true); clearTimeout(copyTimeout.current); copyTimeout.current = setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão de área de transferência */ }
  };

  return { days, day, setDay, now, copied, fullAddress, copy };
}
