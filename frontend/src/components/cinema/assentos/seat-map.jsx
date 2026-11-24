"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Accessibility, Box, Check, Clock, Grid2X2, Heart, Minus, Plus, Ticket, X } from "lucide-react";
import { arrangedSeats, seatStatus, seatType } from "./seat-layout.mjs";
import styles from "./seat-selection.module.css";

const RoomSceneView = dynamic(() => import("./room-scene-view"), {
  ssr: false,
  loading: () => <p role="status" className={styles.sceneMessage}>Abrindo visualizador 3D…</p>,
});

export default function SeatMap({ selection, seats, selectedSeat, onSeatSelect, screenLabel = "Tela", spaceType, sceneUrl }) {
  const [zoom, setZoom] = useState(100);
  const [focused, setFocused] = useState(null);
  const [view, setView] = useState("2d");
  const buttons = useRef(new Map());
  const id = useId();
  const layout = useMemo(()=>arrangedSeats(seats),[seats]);
  const interactive = Boolean(selection || onSeatSelect);
  const is3d = Boolean(sceneUrl && view === "3d");
  const scenery = spaceType === "ESTADIO" ? "field"
    : ["DRIVE_IN", "ESTACIONAMENTO"].includes(spaceType) ? "drive"
    : ["SALAO_EVENTOS", "PRACA", "ESPACO_PUBLICO", "OUTRO"].includes(spaceType) ? "stage" : "cinema";
  const landmark = scenery === "field" ? "Campo" : scenery === "drive" ? "Telão" : scenery === "stage" ? "Palco" : screenLabel;
  const selected = seatId => selection ? selection.selected.includes(seatId) : selectedSeat===seatId;
  const disabled = seat => Boolean(selection && (seat.occupied || selection.continuing));
  const tabSeat = seats.find(seat=>seat.id===focused&&!disabled(seat))?.id
    ?? seats.find(seat=>selected(seat.id)&&!disabled(seat))?.id ?? seats.find(seat=>!disabled(seat))?.id;

  useEffect(()=>{
    if(selectedSeat) buttons.current.get(selectedSeat)?.scrollIntoView({block:'nearest',inline:'nearest'});
  },[selectedSeat]);

  function navigate(event, seat, rowIndex) {
    const row = layout.rows[rowIndex].seats.filter(item=>!disabled(item));
    let target;
    if (event.key==="Home" || event.key==="End") target=event.key==="Home"?row[0]:row.at(-1);
    else if (event.key==="ArrowLeft") target=row.findLast(item=>item.position<seat.position);
    else if (event.key==="ArrowRight") target=row.find(item=>item.position>seat.position);
    else if (event.key==="ArrowUp" || event.key==="ArrowDown") {
      const step=event.key==="ArrowUp"?-1:1;
      for(let index=rowIndex+step;index>=0&&index<layout.rows.length&&!target;index+=step) {
        for(const item of layout.rows[index].seats) {
          if(!disabled(item)&&(!target||Math.abs(item.position-seat.position)<Math.abs(target.position-seat.position)))target=item;
        }
      }
    } else return;
    event.preventDefault();
    if(target)buttons.current.get(target.id)?.focus();
  }

  return <section className={styles.mapSection} aria-label="Mapa de assentos" data-view={is3d ? "3d" : "2d"}>
    <div className={styles.mapToolbar}>
      {sceneUrl && seats.length > 0 ? <div className={styles.viewPicker} role="group" aria-label="Visualização do mapa">
        <button type="button" aria-pressed={!is3d} onClick={()=>setView("2d")}><Grid2X2 size={16} aria-hidden="true" />2D</button>
        <button type="button" aria-pressed={is3d} onClick={()=>setView("3d")}><Box size={16} aria-hidden="true" />3D</button>
      </div> : <span>Mapa da sala</span>}
      {!is3d && <div className={styles.zoom}>
        <button type="button" aria-label="Diminuir mapa" disabled={zoom<=80} onClick={()=>setZoom(value=>value-10)}><Minus size={16} /></button>
        <label><span className="sr-only">Zoom do mapa</span><input type="range" min="80" max="150" step="10" value={zoom} onChange={event=>setZoom(Number(event.target.value))} /></label>
        <button type="button" aria-label="Ampliar mapa" disabled={zoom>=150} onClick={()=>setZoom(value=>value+10)}><Plus size={16} /></button>
        <output>{zoom}%</output>
      </div>}
    </div>
    {is3d ? <RoomSceneView url={sceneUrl} seats={seats} selection={selection} /> : <>
    <p id={id} className={styles.mapHint}>{interactive?'Use as setas para navegar e Espaço para escolher um assento. ':''}Em telas pequenas, deslize o mapa para os lados.</p>
    {!seats.length ? <p className={styles.mapHint}>A sala ainda não tem assentos.</p> :
      <div className={styles.mapScroll} tabIndex={interactive?undefined:0} role="region" aria-label="Disposição dos assentos">
        <div className={styles.map} style={{"--columns":layout.count,"--seat-size":`${Math.round(30*zoom/100)}px`,"--seat-gap":`${6*zoom/100}px`}}>
          <div className={styles.screen} aria-label={landmark}><span>{landmark}</span></div>
          {layout.rows.map((row,rowIndex)=><div className={styles.seatRow} key={row.label} role="group" aria-label={`Fileira ${row.label}`}>
            <span className={styles.rowLabel} style={{gridColumn:1}} aria-hidden="true">{row.label}</span>
            {row.seats.map(seat=>{
              const state=seat.availability??(seat.occupied?'INDISPONIVEL':'DISPONIVEL');
              const active=selected(seat.id);
              const label=`${seat.row}${seat.number} · ${seatStatus[state]}${seat.type&&seat.type!=='COMUM'?` · ${seatType[seat.type]}`:''}`;
              const icon=active?Check:state==='VENDIDO'?Ticket:state==='RESERVADO'?Clock:state==='INDISPONIVEL'?X:seat.accessible?Accessibility:seat.type==='CASAL'?Heart:null;
              const Icon=icon;
              const common={
                className:`${styles.seat} ${seat.accessible?styles.accessible:''} ${active?styles.selected:''}`,
                style:{gridColumn:layout.columns.get(seat.position)+1},
                'data-availability':state,
                'data-seat-id': seat.id,
                title:label
              };
              const content=Icon?<Icon size={14} aria-hidden="true" />:<span className={styles.seatNumber}>{seat.number}</span>;
              if(!interactive)return <span key={seat.id} {...common} aria-label={label}>{content}</span>;
              return <button key={seat.id} {...common} type="button"
                ref={element=>{if(element)buttons.current.set(seat.id,element);else buttons.current.delete(seat.id);}}
                disabled={disabled(seat)} tabIndex={seat.id===tabSeat?0:-1} aria-pressed={active} aria-label={label} aria-describedby={id}
                onFocus={()=>setFocused(seat.id)} onKeyDown={event=>navigate(event,seat,rowIndex)}
                onClick={()=>selection?selection.selectSeat(seat.id):onSeatSelect(seat.id)}>{content}</button>;
            })}
            <span className={styles.rowLabel} style={{gridColumn:layout.count+2}} aria-hidden="true">{row.label}</span>
          </div>)}
        </div>
      </div>}
    <ul className={styles.legend} aria-label="Legenda do mapa">
      <li><span className={styles.legendAvailable} />Disponível</li>
      <li><span className={styles.legendOccupied}><X size={12} /></span>Indisponível</li>
      {(selection||seats.some(seat=>seat.availability==='RESERVADO'||seat.availability==='VENDIDO'))&&<>
        <li><span className={styles.legendOccupied}><Clock size={12} /></span>Reservado</li>
        <li><span className={styles.legendOccupied}><Ticket size={12} /></span>Vendido</li>
      </>}
      {interactive&&<li><span className={styles.legendSelected}><Check size={12} /></span>Selecionado</li>}
      <li><span className={styles.legendAccessible}><Accessibility size={14} /></span>Acessível</li>
      {seats.some(seat=>seat.type==='CASAL')&&<li><span className={styles.legendAvailable}><Heart size={13} /></span>Casal</li>}
    </ul></>}
  </section>;
}
