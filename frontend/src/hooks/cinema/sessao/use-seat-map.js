"use client";

import { useRef, useState } from "react";
import { COLUMNS, SEATS } from "@/components/cinema/assentos/seat-state.mjs";

export default function useSeatMap(selection) {
  const [activeSeat, setActiveSeat] = useState(selection.selected[0] || "A1");
  const buttons = useRef(new Map());

  function navigate(event, index) {
    const increments = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNS, ArrowDown: COLUMNS };
    let next = index;
    if (event.key === "Home") next = Math.floor(index / COLUMNS) * COLUMNS;
    else if (event.key === "End") next = Math.floor(index / COLUMNS) * COLUMNS + COLUMNS - 1;
    else if (event.key in increments) next += increments[event.key];
    else return;
    event.preventDefault();
    const direction = event.key === "End" ? -1 : (increments[event.key] || 1);
    while (next >= 0 && next < SEATS.length && SEATS[next].occupied) next += direction;
    if (next >= 0 && next < SEATS.length) buttons.current.get(SEATS[next].id)?.focus();
  }

  const registerSeat = (id, element) => { if (element) buttons.current.set(id, element); else buttons.current.delete(id); };
  return { activeSeat, setActiveSeat, registerSeat, navigate };
}
