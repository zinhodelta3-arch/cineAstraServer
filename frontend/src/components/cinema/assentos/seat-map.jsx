"use client";

import useSeatMap from "@/hooks/cinema/sessao/use-seat-map";
import { Accessibility, Check, Minus, Plus, X } from "lucide-react";
import { COLUMNS, ROWS, SEATS } from "./seat-state.mjs";
import styles from "./seat-selection.module.css";

export default function SeatMap({ selection }) {
  const { activeSeat, setActiveSeat, registerSeat, navigate } = useSeatMap(selection);

  return (
    <section className={styles.mapSection} aria-label="Mapa de assentos">
      <div className={styles.mapToolbar}>
        <span>Fundo da sala</span>
        <div className={styles.zoom}>
          <button type="button" aria-label="Diminuir mapa" disabled={selection.zoom <= 80} onClick={selection.zoomOut}><Minus size={16} /></button>
          <label><span className="sr-only">Zoom do mapa</span><input type="range" min="80" max="150" step="10" value={selection.zoom} onChange={selection.changeZoom} /></label>
          <button type="button" aria-label="Ampliar mapa" disabled={selection.zoom >= 150} onClick={selection.zoomIn}><Plus size={16} /></button>
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
                  ref={(element) => registerSeat(seat.id, element)}
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
