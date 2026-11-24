"use client";

import { useRef, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

const loadThreshold = 64;

export default function FilmAvailability({ film }) {
  const [cinemaFilter, setCinemaFilter] = useState('');
  const listRef = useRef(null);
  const { locations, availability } = film;
  const byLocal = new Map(availability.items.map(item => [item.localId, item]));
  const availableCount = availability.items.filter(item => item.openSessions > 0).length;
  const visibleLocations = cinemaFilter
    ? locations.items.filter(local => String(local.id_local) === cinemaFilter)
    : locations.items;

  function handleScroll(event) {
    if (cinemaFilter || !locations.cursor || locations.loading || locations.error) return;
    const list = event.currentTarget;
    if (list.scrollHeight - list.scrollTop - list.clientHeight <= loadThreshold) locations.loadMore();
  }

  function filterByCinema(event) {
    setCinemaFilter(event.target.value);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  function showProgram(id) {
    if (id !== film.localId) film.changeLocal(id);
    const title = document.getElementById('cf-sessions-title');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    title?.focus({ preventScroll: true });
    title?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  }

  return <section className="cf-availability" aria-labelledby="cf-availability-title">
    <div className="cf-availability-heading">
      <div><h3 id="cf-availability-title">Disponibilidade por localização</h3><p>Veja em quais cinemas este filme tem sessões futuras.</p></div>
      {!availability.loading && !availability.error && <span className="cf-availability-count">
        {availableCount === 1 ? '1 cinema com lugares' : `${availableCount} cinemas com lugares`}
      </span>}
    </div>
    {availability.loading && <p role="status">Carregando disponibilidade…</p>}
    {availability.error && <p role="alert">{availability.error}</p>}
    {locations.items.length > 0 && <>
      <label htmlFor="cf-availability-cinema" className="cf-field-label">Filtrar por cinema</label>
      <select id="cf-availability-cinema" className="cf-native-select cf-availability-filter" value={cinemaFilter}
        onChange={filterByCinema} aria-controls="cf-availability-list">
        <option value="">Todos os cinemas carregados</option>
        {locations.items.map(local => <option key={local.id_local} value={local.id_local}>{local.nome} · {local.cidade}, {local.estado}</option>)}
      </select>
      {!cinemaFilter && (locations.items.length > 3 || locations.cursor) && <p className="cf-scroll-hint" id="cf-location-scroll-hint"><ChevronDown size={15} aria-hidden="true"/> Role a lista para ver outros cinemas</p>}
      <div id="cf-availability-list" ref={listRef} className="cf-availability-scroll" role="region"
        tabIndex={cinemaFilter ? undefined : 0} aria-label="Lista de cinemas e disponibilidade"
        aria-describedby={!cinemaFilter&&(locations.items.length>3||locations.cursor)?'cf-location-scroll-hint':undefined} onScroll={handleScroll}>
        <div className="cf-availability-list">
          {visibleLocations.map(local => {
            const id = String(local.id_local);
            const info = byLocal.get(id);
            const pending = availability.loading || availability.error;
            return <button type="button" key={id} className="cf-location-card" aria-pressed={id === film.localId} onClick={() => showProgram(id)}>
              <span>
                <span className="cf-location-name"><MapPin size={16} aria-hidden="true" />{local.nome}</span>
                {info?.popular && <span className="cf-location-detail font-semibold text-primary">Mais procurado</span>}
                <span className="cf-location-address">{local.cidade}, {local.estado}</span>
                {info?.formats.length > 0 && <span className="cf-location-detail">Formatos: {info.formats.join(' · ')}</span>}
              </span>
              <span className="cf-location-status">
                <strong>{pending ? '—' : info?.openSessions ? 'Disponível' : info ? 'Sem lugares' : 'Sem sessões'}</strong>
                {!pending && <small>{info ? `${info.openSessions} de ${info.sessions} com lugares` : 'Nenhum horário'}</small>}
              </span>
            </button>;
          })}
        </div>
      </div>
    </>}
    {locations.loading && <p className="cf-availability-note" role="status">Carregando cinemas…</p>}
    {locations.loadedMore && !locations.cursor && !locations.loading && !locations.error && !cinemaFilter && <p className="cf-availability-note" role="status">Todos os cinemas foram carregados.</p>}
    {locations.error && <div className="cf-availability-actions" role="alert">
      <p>{locations.error}</p>
      <button className="cf-native-button" data-variant="outline" type="button"
        onClick={locations.items.length ? locations.loadMore : locations.retry}>Tentar novamente</button>
    </div>}
    {!locations.loading && !locations.error && locations.items.length === 0 && <p className="cf-empty">Nenhum cinema disponível.</p>}
    <p className="cf-availability-note">O destaque considera assentos vendidos nas próximas sessões deste filme. A disponibilidade é confirmada na compra.</p>
  </section>;
}
