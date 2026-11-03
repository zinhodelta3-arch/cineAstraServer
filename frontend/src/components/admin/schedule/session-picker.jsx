"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { scheduleRequest, useAdminSchedule } from "@/hooks/admin/use-admin-schedule";
import styles from "../catalog/catalog.module.css";

const label = (item) => `${item.data?.slice(0, 10) ?? "Data indefinida"} · ${item.horario_inicio?.slice(0, 5) ?? "--:--"} · ${item.titulo_filme ?? `filme #${item.id_filme}`} · ${item.nome_sala ?? `sala #${item.id_sala}`}`;

export function useSessionSelection() {
  const pathname = usePathname();
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState("");
  const list = useAdminSchedule(`sessions?limit=100${date ? `&date=${date}` : ""}`);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("sessao");
    if (!/^[1-9]\d{0,9}$/.test(id ?? "")) return;
    let active = true;
    scheduleRequest(`sessions/${id}`).then((value) => { if (active) setSelected(value); }).catch(() => {});
    return () => { active = false; };
  }, []);
  function select(value) {
    setSelected(value);
    window.history.replaceState(null, "", value ? `${pathname}?sessao=${value.id_sessao}` : pathname);
  }
  return { selected, select, list, date, setDate };
}

export default function SessionPicker({ selection }) {
  const { selected, select, list, date, setDate } = selection;
  return <section className={styles.filmPicker} aria-label="Selecionar sessão">
    <h2>Selecione uma sessão</h2>
    <div className={styles.pickerControl}><label>Data<input type="date" value={date} onChange={(event) => { setDate(event.target.value); select(null); }} /></label>
      <label>Sessão<select value={selected?.id_sessao ?? ""} onChange={(event) => select(list.items.find((item) => item.id_sessao === event.target.value) ?? null)} disabled={list.loading || (!list.items.length && !selected)}><option value="">Selecione uma sessão</option>{selected && !list.items.some((item) => item.id_sessao === selected.id_sessao) && <option value={selected.id_sessao}>{label(selected)}</option>}{list.items.map((item) => <option key={item.id_sessao} value={item.id_sessao}>{label(item)}</option>)}</select></label>
      {list.nextCursor && <button type="button" className={styles.secondary} onClick={list.loadMore} disabled={list.loadingMore}>{list.loadingMore ? "Carregando…" : "Mais sessões"}</button>}
    </div>
    {selected && <p className={styles.hint}>Sessão #{selected.id_sessao} · {label(selected)}</p>}
    {list.error && <p className={styles.error} role="alert">{list.error}</p>}
  </section>;
}
