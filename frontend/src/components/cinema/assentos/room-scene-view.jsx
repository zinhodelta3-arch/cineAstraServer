'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Eye, RotateCcw } from 'lucide-react';
import { publicGet } from '@/lib/api/public-api.mjs';
import { seatLabel } from './seat-state.mjs';
import { seatStatus, seatType } from './seat-layout.mjs';
import { openStudio } from './studio-viewer.mjs';
import styles from './seat-selection.module.css';

function SceneCanvas({ scene, seats, selection }) {
  const canvas = useRef(null), renderer = useRef(null), gesture = useRef(null);
  const [inspectedId, setInspectedId] = useState('');
  const [camera, setCamera] = useState('overview');
  const [failed, setFailed] = useState(false);
  const place = seats.find(seat => seat.id === inspectedId);
  const selected = Boolean(place && selection.selected.includes(place.id));

  useEffect(() => {
    if (failed) return;
    const node = canvas.current;
    let view;
    try { view = openStudio(node, scene, () => setFailed(true)); }
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
    renderer.current?.setSeats({ selected: selection.selected, inspectedId, unavailable: seats.filter(seat => seat.occupied).map(seat => seat.id) });
  }, [inspectedId, seats, selection.selected]);

  function inspect(id) {
    if (!id) return;
    setInspectedId(id);
    if (camera === 'inside') renderer.current?.inside(id);
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

  function viewFromSeat() {
    if (!place) return;
    setCamera('inside');
    renderer.current?.inside(place.id);
  }

  if (failed) return <p role="status" className={styles.sceneMessage}>A visualização 3D não está disponível neste dispositivo. Escolha seus lugares no mapa 2D.</p>;
  return <div className={styles.studioViewer}>
    <div className={styles.studioToolbar} role="group" aria-label="Câmera do modelo">
      <button type="button" aria-pressed={camera === 'overview'} onClick={() => { setCamera('overview'); renderer.current?.overview(); }}><Box size={16} aria-hidden="true" />Visão geral</button>
      <button type="button" aria-pressed={camera === 'inside'} disabled={!place} onClick={viewFromSeat}><Eye size={16} aria-hidden="true" />Primeira pessoa</button>
      {camera === 'inside' && <button type="button" onClick={viewFromSeat}><RotateCcw size={15} aria-hidden="true" />Recentralizar</button>}
    </div>
    <p className={styles.sceneMessage}>Arraste ou use as setas para olhar. Clique ou toque em uma poltrona para conferir o lugar.</p>
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
    <div className={styles.studioSeat}>
      <label>Assento<select value={place?.id ?? ''} onChange={event => inspect(event.target.value)}>
        <option value="" disabled>Escolha um assento</option>
        {seats.map(seat => <option key={seat.id} value={seat.id}>{seatLabel(seat)}</option>)}
      </select></label>
      <p role="status">{place ? `${seatType[place.type]} · ${selected ? 'No seu pedido' : seatStatus[place.availability]}` : ''}</p>
      {place && (selected || !place.occupied) && <button type="button" data-add={!selected}
        disabled={selection.continuing} onClick={() => selection.selectSeat(place.id)}>
        {selected ? `Remover ${seatLabel(place)}` : `Adicionar ${seatLabel(place)}`}
      </button>}
    </div>
  </div>;
}

export default function RoomSceneView({ url, seats, selection }) {
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
  if (state?.retry !== retry) return <p role="status" className={styles.sceneMessage}>Carregando modelo da sala…</p>;
  if (state.error) return <div className={styles.sceneMessage}>
    <p role="status">{state.missing ? 'A equipe ainda não publicou o modelo desta sala. Os lugares estão no mapa 2D.' : 'Não foi possível carregar o modelo da sala.'}</p>
    {!state.missing && <button type="button" className="mt-2 underline" onClick={() => setRetry(value=>value+1)}>Tentar novamente</button>}
  </div>;
  const activeSeats = seats.filter(seat => seat.availability !== 'INDISPONIVEL');
  const ids = new Set(state.scene.objects.map(object=>object.seatId).filter(Boolean));
  if (ids.size !== activeSeats.length || activeSeats.some(seat=>!ids.has(seat.id))) {
    return <p role="status" className={styles.sceneMessage}>O modelo da sala precisa ser atualizado. Escolha os lugares no mapa 2D.</p>;
  }
  return <SceneCanvas scene={state.scene} seats={activeSeats} selection={selection} />;
}
