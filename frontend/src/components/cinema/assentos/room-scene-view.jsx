'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { publicGet } from '@/lib/api/public-api.mjs';
import { seatLabel } from './seat-state.mjs';
import { seatStatus, seatType } from './seat-layout.mjs';
import { openStudio } from './studio-viewer.mjs';
import styles from './seat-selection.module.css';

const noSelectedSeats = [];

function SceneCanvas({ scene, seats, selection, viewPicker }) {
  const canvas = useRef(null), renderer = useRef(null), gesture = useRef(null);
  const [inspectedId, setInspectedId] = useState('');
  const [viewingFromSeat, setViewingFromSeat] = useState(false);
  const [failed, setFailed] = useState(false);
  const place = seats.find(seat => seat.id === inspectedId);
  const selectedSeats = selection?.selected ?? noSelectedSeats;
  const selected = Boolean(place && selectedSeats.includes(place.id));
  const cameraLabel = viewingFromSeat ? 'Voltar ao mapa 3D' : 'Ver da poltrona';
  const CameraIcon = viewingFromSeat ? ArrowLeft : Eye;

  useEffect(() => {
    if (failed) return;
    const node = canvas.current;
    let view;
    try { view = openStudio(node, scene, () => setFailed(true), { seatSelection: true }); }
    catch {
      const frame = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(frame);
    }
    renderer.current = view;
    const probe = document.createElement('canvas').getContext('2d');
    function theme() {
      const style = getComputedStyle(node);
      const hex = (property, fallback) => {
        const color = style.getPropertyValue(property).trim();
        if (!probe || !color) return fallback;
        probe.clearRect(0,0,1,1);
        probe.fillStyle = color; probe.fillRect(0,0,1,1);
        return '#' + Array.from(probe.getImageData(0,0,1,1).data).slice(0,3).map(value => value.toString(16).padStart(2,'0')).join('');
      };
      view.setTheme(hex('--background','#231915'),hex('--primary','#eec47c'),hex('--foreground','#f5e9df'));
    }
    theme();
    const observer = new MutationObserver(theme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class','data-theme','style'] });
    return () => { observer.disconnect(); renderer.current = null; view.close(); };
  }, [scene, failed]);

  useEffect(() => {
    renderer.current?.setSeats({ selected: selectedSeats, inspectedId, unavailable: seats.filter(seat => seat.occupied).map(seat => seat.id) });
  }, [inspectedId, seats, selectedSeats]);

  function inspect(id) {
    if (!id) return;
    setInspectedId(id);
    if (viewingFromSeat) renderer.current?.inside(id);
  }

  function end(event) {
    const drag = gesture.current;
    if (drag?.id !== event.pointerId) return;
    gesture.current = null;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (drag.moved || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 5 ||
      event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom) return;
    inspect(renderer.current?.pick(event.clientX,event.clientY));
  }

  function toggleSeatView() {
    if (!place) return;
    if (viewingFromSeat) renderer.current?.overview();
    else renderer.current?.inside(place.id);
    setViewingFromSeat(!viewingFromSeat);
  }

  if (failed) return <>
    <div className={styles.mapToolbar}>{viewPicker}</div>
    <p role="status" className={styles.sceneMessage}>A visualização 3D não está disponível neste dispositivo. Escolha seus lugares no mapa 2D.</p>
  </>;
  return <div className={styles.studioViewer}>
    <div className={styles.mapToolbar}>
      {viewPicker}
      <div className={styles.studioSeat} role="group" aria-label="Seleção de assento 3D">
        <label className={styles.studioSeatLabel}>Assento<select value={place?.id ?? ''} onChange={event => inspect(event.target.value)}>
          <option value="" disabled>Escolha um assento</option>
          {seats.map(seat => <option key={seat.id} value={seat.id}>{seatLabel(seat)}</option>)}
        </select></label>
        <p className={styles.studioSeatStatus} role="status">{place ? `${seatType[place.type]} · ${selected ? 'No seu pedido' : seatStatus[place.availability]}` : ''}</p>
        {place && <div className={styles.studioSeatActions}>
          {selection && (selected || !place.occupied) && <button type="button" data-choose={!selected}
            disabled={selection.continuing} onClick={() => selection.selectSeat(place.id)}>
            {selected ? `Remover ${seatLabel(place)}` : `Escolher ${seatLabel(place)}`}
          </button>}
          <button type="button" className={styles.studioSeatCamera} aria-label={cameraLabel} title={cameraLabel} onClick={toggleSeatView}>
            <CameraIcon size={17} aria-hidden="true" />
          </button>
        </div>}
      </div>
    </div>
    <p className={styles.sceneMessage}>Arraste ou use as setas para olhar. Toque na poltrona ou selecione um assento no menu para conferir o lugar.</p>
    <canvas ref={canvas} className={styles.studioCanvas} tabIndex={0} aria-label="Modelo 3D da sala. Use as setas para olhar."
        onKeyDown={event => {
          const offsets = { ArrowLeft: [14,0], ArrowRight: [-14,0], ArrowUp: [0,12], ArrowDown: [0,-12] };
          if (!offsets[event.key]) return;
          event.preventDefault();
          renderer.current?.look(...offsets[event.key]);
        }}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const drag = gesture.current;
          if (drag?.id !== event.pointerId) return;
          const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
          if (!drag.moved && Math.hypot(dx,dy)<5) return;
          gesture.current = { ...drag, x: event.clientX, y: event.clientY, moved: true };
          renderer.current?.look(dx,dy);
        }}
        onPointerUp={end} onPointerCancel={() => { gesture.current = null; }}
    />
  </div>;
}

export default function RoomSceneView({ url, seats, selection, viewPicker }) {
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    publicGet(url,{ signal:abort.signal }).then(scene => {
      if (!abort.signal.aborted) setState({ scene, retry });
    }).catch(error => {
      if (!abort.signal.aborted) setState({ missing:error.status===404, error:true, retry });
    });
    return () => abort.abort();
  }, [url,retry]);
  const activeSeats = seats.filter(seat => seat.availability !== 'INDISPONIVEL');
  let message;
  if (state?.retry !== retry) {
    message = 'Carregando modelo da sala…';
  } else if (state.error) {
    message = state.missing ? 'A equipe ainda não publicou o modelo desta sala. Os lugares estão no mapa 2D.' : 'Não foi possível carregar o modelo da sala.';
  } else {
    const ids = new Set(state.scene.objects.map(object => object.seatId).filter(Boolean));
    if (ids.size === activeSeats.length && activeSeats.every(seat => ids.has(seat.id))) {
      return <SceneCanvas scene={state.scene} seats={activeSeats} selection={selection} viewPicker={viewPicker} />;
    }
    message = 'O modelo da sala precisa ser atualizado. Escolha os lugares no mapa 2D.';
  }
  return <>
    <div className={styles.mapToolbar}>{viewPicker}</div>
    <div className={styles.sceneMessage}>
      <p role="status">{message}</p>
      {state?.retry === retry && state.error && !state.missing &&
        <button type="button" className="mt-2 underline" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button>}
    </div>
  </>;
}
