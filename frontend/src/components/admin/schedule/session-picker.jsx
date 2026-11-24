"use client";

import { useState } from "react";
import { scheduleRequest, useAdminSchedule } from "@/hooks/admin/use-admin-schedule";
import { useAdminVenues } from "@/hooks/admin/use-admin-venues";
import { useSessionContext } from "@/components/session-context/session-context";
import ScheduleSelect from "./schedule-select";
import styles from "../catalog/catalog.module.css";

const label = (item) => `${item.data?.slice(0, 10) ?? "Data indefinida"} · ${item.horario_inicio?.slice(0, 5) ?? "--:--"} · ${item.titulo_filme ?? `filme #${item.id_filme}`} · ${item.nome_sala ?? `sala #${item.id_sala}`}`;

export function useSessionSelection() {
  const selection = useSessionContext(scheduleRequest);
  const [choosing, setChoosing] = useState(false);
  const showPicker = choosing || !selection.selectedId;
  const [date, setDate] = useState("");
  const [localOverride, setLocalOverride] = useState(null);
  const localId = localOverride ?? selection.localId;
  const query = new URLSearchParams({ limit:'20' });
  if (date) query.set('date', date);
  if (localId) query.set('localId', localId);
  const list = useAdminSchedule(showPicker ? `sessions?${query}` : null, { itemKey:'id_sessao' });
  return { ...selection, selected:selection.session, select(value) {
    selection.choose(value);
    if (value) setChoosing(false);
  }, list, date, setDate, localId, setLocalOverride, showPicker, setChoosing };
}

export default function SessionPicker({ selection }) {
  const { selected, select, list, date, setDate } = selection;
  const locations = useAdminVenues(selection.showPicker ? 'locations?limit=20' : null, { itemKey:'id_local' });
  if (!selection.showPicker) return <button type="button" className={styles.secondary} onClick={() => selection.setChoosing(true)}>Trocar sessão</button>;
  return <section className={styles.filmPicker} aria-label="Selecionar sessão">
    <h2>Selecione uma sessão</h2>
    <div className={styles.pickerControl}><label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>Cinema<ScheduleSelect value={selection.localId} onChange={event => selection.setLocalOverride(event.target.value)}><option value="">Todos</option>
        {selection.localId && !locations.items.some(location => location.id_local === selection.localId) && <option value={selection.localId}>{selected?.nome_local ?? `Cinema #${selection.localId}`}</option>}
        {locations.items.map(location => <option key={location.id_local} value={location.id_local}>{location.nome}</option>)}
      </ScheduleSelect></label>
      {locations.nextCursor && <button type="button" className={styles.secondary} onClick={locations.loadMore} disabled={locations.loadingMore}>Mais cinemas</button>}
      <label>Sessão<ScheduleSelect value={selected?.id_sessao ?? ""} onChange={(event) => select(list.items.find((item) => item.id_sessao === event.target.value) ?? null)} disabled={list.loading || (!list.items.length && !selected)}><option value="">{list.loading ? "Carregando sessões…" : list.error && !list.items.length ? "Sessões indisponíveis" : list.items.length || selected ? "Selecione uma sessão" : "Nenhuma sessão encontrada"}</option>{selected && !list.items.some((item) => item.id_sessao === selected.id_sessao) && <option value={selected.id_sessao}>{label(selected)}</option>}{list.items.map((item) => <option key={item.id_sessao} value={item.id_sessao}>{label(item)}</option>)}</ScheduleSelect></label>
      {list.nextCursor && <button type="button" className={styles.secondary} onClick={list.loadMore} disabled={list.loadingMore}>{list.loadingMore ? "Carregando…" : "Mais sessões"}</button>}
    </div>
    {list.error && <div><p className={styles.error} role="alert">{list.error}</p>{!list.nextCursor && <button type="button" className={styles.secondary} onClick={list.reload}>Tentar novamente</button>}</div>}
  </section>;
}
