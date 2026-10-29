"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRIENDS_MOCK, buildFriends, buildStrip, getTonightContext, pickMovie } from "./astra-spin-engine";

// Linha do tempo do evento (ms)
const SPIN_MS = 5400; // pôsteres girando até parar
const HUSH_MS = 700; // luzes caem e a roleta se ajusta
const FLASH_MS = 900; // clarão + revelação do vencedor
const SPIN_MS_REDUCED = 700;

// phase: idle -> spinning -> hush -> flash -> revealed
export default function useAstraSpin({ catalog, historyIds = [], myListIds = [] }) {
  const [mode, setModeState] = useState("custom");
  const [mood, setMood] = useState(null);
  const [genre, setGenre] = useState(null);
  const [time, setTime] = useState("any");
  const [company, setCompany] = useState(null);
  const [friendIds, setFriendIds] = useState(() => FRIENDS_MOCK.map((f) => f.id));

  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [strip, setStrip] = useState([]);
  const [spinId, setSpinId] = useState(0);
  const [duration, setDuration] = useState(SPIN_MS);
  const [notice, setNotice] = useState("");
  const [tonight, setTonight] = useState(null);

  const seen = useRef(new Set()); // filmes já sorteados nesta sessão
  const timers = useRef([]);

  const friends = useMemo(() => buildFriends(catalog), [catalog]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Calculado só no cliente para não divergir do HTML renderizado no servidor.
  useEffect(() => {
    setTonight(getTonightContext());
    return clearTimers;
  }, [clearTimers]);

  const busy = phase === "spinning" || phase === "hush" || phase === "flash";
  const canSpin = catalog.length > 0 && (mode !== "friends" || friendIds.length > 0);

  const changeMode = useCallback((id) => {
    setModeState(id);
    setNotice("");
  }, []);

  const toggleFriend = useCallback((id) => {
    setFriendIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }, []);

  const spin = useCallback(() => {
    if (busy || !canSpin) return;

    const cfg = {
      mode, mood, genre, time, company,
      friends: friends.filter((f) => friendIds.includes(f.id)),
      now: new Date(),
      historyIds, myListIds,
      exclude: seen.current,
    };

    let picked = pickMovie(catalog, cfg);
    let msg = "";

    if (!picked && seen.current.size) {
      seen.current.clear();
      picked = pickMovie(catalog, cfg);
      msg = "Você já passou por todos os filmes possíveis. A roleta recomeçou do zero.";
    }
    if (!picked) {
      setNotice("Nenhum filme encaixa nesses filtros. Mude alguma escolha e gire de novo.");
      return;
    }
    if (picked.relaxed.length) {
      const l = picked.relaxed;
      const txt = l.length > 1 ? `${l.slice(0, -1).join(", ")} e ${l[l.length - 1]}` : l[0];
      msg = `Nada encaixou exatamente, então flexibilizamos ${txt}.`;
    }

    seen.current.add(picked.entry.id);

    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const spinMs = reduce ? SPIN_MS_REDUCED : SPIN_MS;
    const hushMs = reduce ? 0 : HUSH_MS;

    clearTimers();
    setResult(picked);
    setStrip(buildStrip(catalog, picked.entry));
    setDuration(spinMs);
    setNotice(msg);
    setSpinId((n) => n + 1);
    setPhase("spinning");

    const t1 = spinMs + 150;
    timers.current.push(setTimeout(() => setPhase("hush"), t1));
    timers.current.push(setTimeout(() => setPhase("flash"), t1 + hushMs));
    timers.current.push(
      setTimeout(() => {
        setPhase("revealed");
        if (typeof navigator !== "undefined") navigator.vibrate?.([40, 60, 90]);
      }, t1 + hushMs + FLASH_MS)
    );
  }, [busy, canSpin, mode, mood, genre, time, company, friends, friendIds, historyIds, myListIds, catalog, clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setResult(null);
  }, [clearTimers]);

  return {
    mode, changeMode,
    mood, setMood,
    genre, setGenre,
    time, setTime,
    company, setCompany,
    friends, friendIds, toggleFriend,
    tonight,
    phase, busy, canSpin,
    result, strip, spinId, duration, notice,
    spin, reset,
  };
}