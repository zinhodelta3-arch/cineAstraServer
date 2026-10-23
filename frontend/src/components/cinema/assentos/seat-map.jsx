"use client";

import { useRef, useState } from "react";
import { Accessibility, Check, Minus, Plus, X } from "lucide-react";
import { COLUMNS, ROWS, SEATS } from "./seat-state.mjs";
import styles from "./seat-selection.module.css";

export default function SeatMap({ selection }) {
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

  return (
    <section className={styles.mapSection} aria-label="Mapa de assentos">
      <div className={styles.mapToolbar}>
        <span>Fundo da sala</span>
        <div className={styles.zoom}>
          <button type="button" aria-label="Diminuir mapa" disabled={selection.zoom <= 80} onClick={() => selection.setZoom((value) => value - 10)}><Minus size={16} /></button>
          <label><span className="sr-only">Zoom do mapa</span><input type="range" min="80" max="150" step="10" value={selection.zoom} onChange={(event) => selection.setZoom(Number(event.target.value))} /></label>
          <button type="button" aria-label="Ampliar mapa" disabled={selection.zoom >= 150} onClick={() => selection.setZoom((value) => value + 10)}><Plus size={16} /></button>
          <output>{selection.zoom}%</output>
        </div>
      </div>
      <p id="seat-instructions" className={styles.mapHint}>Escolha no mapa. Use as setas do teclado para navegar e Espaço para selecionar. Em telas pequenas, deslize para os lados.</p>
      <div className={styles.mapScroll}>
        <div className={styles.map} style={{ "--seat-size": `${30 * selection.zoom / 100}px`, "--seat-gap": `${6 * selection.zoom / 100}px` }}>
          <div className={styles.numbers} aria-hidden="true"><span />{Array.from({ length: COLUMNS }, (_, i) => <span className={i === 10 ? styles.afterAisle : ""} key={i}>{i + 1}</span>)}<span /></div>
          {ROWS.map((row) => (
            <div className={`${styles.seatRow} ${row === "G" ? styles.accessRow : ""}`} key={row} role="group" aria-label={`Fileira ${row}`}>
              <span className={styles.rowLabel} aria-hidden="true">{row}</span>
              {SEATS.filter((seat) => seat.row === row).map((seat) => {
                const selected = selection.selected.includes(seat.id);
                return <button
                  key={seat.id}
                  ref={(element) => { if (element) buttons.current.set(seat.id, element); else buttons.current.delete(seat.id); }}
                  type="button"
                  className={`${styles.seat} ${seat.number === 11 ? styles.afterAisle : ""} ${seat.accessible ? styles.accessible : ""} ${selected ? styles.selected : ""}`}
                  disabled={seat.occupied || selection.continuing}
                  tabIndex={seat.id === activeSeat ? 0 : -1}
                  aria-pressed={selected}
                  aria-label={`${seat.id}${seat.accessible ? ", acessível" : ""}, ${seat.occupied ? "indisponível" : selected ? "selecionado" : "disponível"}`}
                  aria-describedby="seat-instructions"
                  title={`${seat.id}${seat.accessible ? " · Acessível" : ""}`}
                  onFocus={() => setActiveSeat(seat.id)}
                  onKeyDown={(event) => navigate(event, SEATS.indexOf(seat))}
                  onClick={() => selection.selectSeat(seat.id)}
                >{seat.occupied ? <X size={14} aria-hidden="true" /> : selected ? <Check size={15} aria-hidden="true" /> : seat.accessible ? <Accessibility size={17} aria-hidden="true" /> : <span className={styles.seatNumber}>{seat.number}</span>}</button>;
              })}
              <span className={styles.rowLabel} aria-hidden="true">{row}</span>
            </div>
          ))}
          <div className={styles.screen} aria-label="Tela na frente da fileira L"><span>Tela</span></div>
        </div>
      </div>
      <ul className={styles.legend} aria-label="Legenda do mapa">
        <li><span className={styles.legendAvailable} />Disponível</li>
        <li><span className={styles.legendOccupied}><X size={12} /></span>Indisponível</li>
        <li><span className={styles.legendSelected}><Check size={12} /></span>Selecionado</li>
        <li><span className={styles.legendAccessible}><Accessibility size={14} /></span>Acessível</li>
      </ul>
    </section>
  );
}
