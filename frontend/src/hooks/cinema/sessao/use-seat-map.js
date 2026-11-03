"use client";

import { useRef, useState } from "react";

export default function useSeatMap(selection, seats) {
  const [activeSeat, setActiveSeat] = useState(selection.selected[0] || seats.find(seat => !seat.occupied)?.id);
  const buttons = useRef(new Map());
  const rows = [...new Set(seats.map(seat => seat.row))];
  const columns = Math.max(0, ...seats.map(seat => seat.number));

  function navigate(event, seat) {
    const rowIndex = rows.indexOf(seat.row);
    const directions = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    let target;
    if (event.key === "Home" || event.key === "End") {
      const sameRow = seats.filter(item => item.row === seat.row && !item.occupied);
      target = event.key === "Home" ? sameRow[0] : sameRow.at(-1);
    } else if (directions[event.key]) {
      const [rowStep, numberStep] = directions[event.key];
      let nextRow = rowIndex + rowStep, nextNumber = seat.number + numberStep;
      while (nextRow >= 0 && nextRow < rows.length && nextNumber > 0 && nextNumber <= columns) {
        target = seats.find(item => item.row === rows[nextRow] && item.number === nextNumber && !item.occupied);
        if (target) break;
        nextRow += rowStep;
        nextNumber += numberStep;
      }
    } else return;
    event.preventDefault();
    if (target) buttons.current.get(target.id)?.focus();
  }

  const registerSeat = (id, element) => { if (element) buttons.current.set(id, element); else buttons.current.delete(id); };
  return { activeSeat, setActiveSeat, registerSeat, navigate };
}
