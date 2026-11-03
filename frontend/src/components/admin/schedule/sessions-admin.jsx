"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, ClipboardList, Pencil, Play, Plus, Ticket, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminCatalogList } from "@/hooks/admin/use-admin-catalog";
import { useAdminVenues } from "@/hooks/admin/use-admin-venues";
import { scheduleRequest, useAdminSchedule } from "@/hooks/admin/use-admin-schedule";
import ScheduleLayout, { ScheduleState } from "./schedule-layout";
import styles from "../catalog/catalog.module.css";

const states = { AGENDADA: "Agendada", EM_CARTAZ: "Em cartaz", ENCERRADA: "Encerrada", CANCELADA: "Cancelada" };
const languages = { DUBLADO: "Dublado", LEGENDADO: "Legendado", ORIGINAL: "Original" };

function sessionFields(form, existing) {
  const value = (key) => String(form.get(key) ?? "").trim();
  const price = Number(value("preco_inteira"));
  if (!value("id_filme") || (!existing && !value("id_sala")) || !value("data") || !value("horario_inicio") || !value("horario_fim")) throw new Error("Preencha filme, sala, data e horários.");
  if (!Number.isFinite(price) || price < 0 || price > 99999999.99) throw new Error("Informe um preço válido.");
  const body = { id_filme: value("id_filme"), data: value("data"), horario_inicio: value("horario_inicio"), horario_fim: value("horario_fim"), idioma: value("idioma"), preco_inteira: price.toFixed(2) };
  if (!existing) body.id_sala = value("id_sala");
  if (!existing) return body;
  return Object.fromEntries(Object.entries(body).filter(([key, entry]) => entry !== (key.startsWith("horario_") ? existing[key]?.slice(0, 5) : existing[key])));
}

export default function SessionsAdmin() {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Todos");
  const [localId, setLocalId] = useState("");
  const [formLocalId, setFormLocalId] = useState("");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const params = new URLSearchParams({ limit: "20" });
  if (date) params.set("date", date);
  if (status !== "Todos") params.set("status", status);
  if (localId) params.set("localId", localId);
  const list = useAdminSchedule(`sessions?${params}`);
  const films = useAdminCatalogList("films?limit=100&status=ATIVO&cinema=true");
  const locals = useAdminVenues("locations?limit=100");
  const rooms = useAdminVenues(dialog?.type === "form" && formLocalId ? `locations/${formLocalId}/rooms?limit=100&status=ATIVA` : null);
  const item = dialog?.item;

  function open(type, session = null, nextStatus = null) { setError(""); setNotice(""); setFormLocalId(session?.id_local ?? ""); setDialog({ type, item: session, nextStatus }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try { await task(); setDialog(null); setNotice(message); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  function save(event) {
    event.preventDefault();
    let body;
    try { body = sessionFields(new FormData(event.currentTarget), item); }
    catch (cause) { setError(cause.message); return; }
    if (item && !Object.keys(body).length) { setError("Nenhuma alteração para salvar."); return; }
    run(() => scheduleRequest(item ? `sessions/${item.id_sessao}` : "sessions", { method: item ? "PATCH" : "POST", body }), item ? "Sessão atualizada." : "Sessão agendada.");
  }
  const filmName = (id) => films.items.find((film) => film.id_filme === id)?.titulo ?? `Filme #${id}`;
  const localName = (id) => locals.items.find((local) => local.id_local === id)?.nome ?? `Cinema #${id}`;

  return <ScheduleLayout title="Sessões" description="Programe exibições e acompanhe o estado de cada sessão." action={<button type="button" className={styles.primary} onClick={() => open("form")}><Plus size={16} aria-hidden="true" />Nova sessão</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="sessions-title"><header className={styles.panelHeader}><div><h2 id="sessions-title">Programação</h2><p>Horários, ingressos e registros de presença por sessão.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className={styles.filter}>Cinema<select value={localId} onChange={(event) => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label><label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option>{Object.entries(states).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div>
      <ScheduleState list={list} empty="Nenhuma sessão encontrada para estes filtros." noun="sessões" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de sessões; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Sessões programadas</caption><thead><tr><th scope="col">Filme</th><th scope="col">Cinema e sala</th><th scope="col">Data e horário</th><th scope="col">Idioma</th><th scope="col">Inteira</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{list.items.map((row) => <tr key={row.id_sessao}><th scope="row">{row.titulo_filme ?? filmName(row.id_filme)}<small className={styles.muted}> · #{row.id_sessao}</small></th><td>{row.nome_local ?? localName(row.id_local)}<br /><span className={styles.muted}>{row.nome_sala ?? `Sala #${row.id_sala}`}</span></td><td>{row.data?.slice(0, 10)}<br /><span className={styles.muted}>{row.horario_inicio?.slice(0, 5)}–{row.horario_fim?.slice(0, 5)}</span></td><td>{languages[row.idioma] ?? row.idioma}</td><td>R$ {Number(row.preco_inteira).toFixed(2).replace(".", ",")}</td><td><span className={`${styles.badge} ${["CANCELADA", "ENCERRADA"].includes(row.status) ? styles.inactive : ""}`}>{states[row.status] ?? row.status}</span></td><td><div className={styles.actions}>
        <button type="button" className={styles.iconButton} title="Editar sessão" aria-label={`Editar sessão ${row.id_sessao}`} disabled={row.status !== "AGENDADA"} onClick={() => open("form", row)}><Pencil size={16} aria-hidden="true" /></button>
        <Link className={styles.iconButton} href={`/admin/sessoes/ingressos?sessao=${row.id_sessao}`} title="Ver ingressos" aria-label={`Ingressos da sessão ${row.id_sessao}`}><Ticket size={16} aria-hidden="true" /></Link>
        <Link className={styles.iconButton} href={`/admin/sessoes/presenca?sessao=${row.id_sessao}`} title="Ver presença" aria-label={`Presença da sessão ${row.id_sessao}`}><ClipboardList size={16} aria-hidden="true" /></Link>
        {row.status === "AGENDADA" && <button type="button" className={styles.iconButton} title="Colocar em cartaz" aria-label={`Colocar sessão ${row.id_sessao} em cartaz`} onClick={() => open("transition", row, "EM_CARTAZ")}><Play size={16} aria-hidden="true" /></button>}
        {row.status === "EM_CARTAZ" && <button type="button" className={styles.iconButton} title="Encerrar sessão" aria-label={`Encerrar sessão ${row.id_sessao}`} onClick={() => open("transition", row, "ENCERRADA")}><Check size={16} aria-hidden="true" /></button>}
        {["AGENDADA", "EM_CARTAZ"].includes(row.status) && <button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Cancelar sessão" aria-label={`Cancelar sessão ${row.id_sessao}`} onClick={() => open("transition", row, "CANCELADA")}><XCircle size={16} aria-hidden="true" /></button>}
      </div></td></tr>)}</tbody></table></div>}
      <footer className={styles.footer}><span>Exibindo {list.items.length} sessões{list.nextCursor ? " · há mais registros" : ""}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? "Carregando…" : "Carregar mais"}</button></footer>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === "transition" ? `${states[dialog.nextStatus]} · sessão #${item?.id_sessao}` : item ? "Editar sessão" : "Nova sessão"}</DialogTitle>
      {dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>A sala precisa estar ativa e com assentos cadastrados. Deixe ao menos uma hora entre sessões do mesmo cinema.</DialogDescription><form key={item?.id_sessao ?? "new"} className={styles.form} onSubmit={save}>
        <label className={styles.wide}>Filme<select name="id_filme" required defaultValue={item?.id_filme ?? ""}><option value="">Selecione um filme</option>{item && !films.items.some((film) => film.id_filme === item.id_filme) && <option value={item.id_filme}>{filmName(item.id_filme)}</option>}{films.items.map((film) => <option key={film.id_filme} value={film.id_filme}>{film.titulo}</option>)}</select></label>
        {!item && <><label>Cinema<select value={formLocalId} onChange={(event) => setFormLocalId(event.target.value)} required><option value="">Selecione um cinema</option>{locals.items.filter((local) => local.status === "ATIVO").map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label><label>Sala<select name="id_sala" required disabled={!formLocalId}><option value="">Selecione uma sala</option>{rooms.items.map((room) => <option key={room.id_sala} value={room.id_sala}>{room.nome} · {room.tipo}</option>)}</select></label></>}
        {item && <p className={`${styles.hint} ${styles.wide}`}>{item.nome_local ?? localName(item.id_local)} · {item.nome_sala ?? `sala #${item.id_sala}`}. A sala de uma sessão existente não pode ser alterada.</p>}
        <label>Data<input name="data" type="date" required defaultValue={item?.data?.slice(0, 10) ?? ""} /></label><label>Idioma<select name="idioma" defaultValue={item?.idioma ?? "DUBLADO"}>{Object.entries(languages).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
        <label>Início<input name="horario_inicio" type="time" required defaultValue={item?.horario_inicio?.slice(0, 5) ?? ""} /></label><label>Fim<input name="horario_fim" type="time" required defaultValue={item?.horario_fim?.slice(0, 5) ?? ""} /></label>
        <label>Preço da inteira (R$)<input name="preco_inteira" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={item?.preco_inteira ?? ""} /></label>
        <div className={`${styles.dialogActions} ${styles.wide}`}>{films.nextCursor && <button type="button" className={styles.secondary} onClick={films.loadMore} disabled={films.loadingMore}>Mais filmes</button>}{rooms.nextCursor && <button type="button" className={styles.secondary} onClick={rooms.loadMore} disabled={rooms.loadingMore}>Mais salas</button>}{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div>
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? "Salvando…" : item ? "Salvar alterações" : "Agendar sessão"}</button></div>
      </form></>}
      {dialog?.type === "transition" && <><DialogDescription className={styles.dialogDescription}>{dialog.nextStatus === "CANCELADA" ? "Cancelar esta sessão? Sessões com ingressos vinculados não podem ser canceladas." : dialog.nextStatus === "EM_CARTAZ" ? "Colocar esta sessão em cartaz?" : "Encerrar esta sessão?"}</DialogDescription>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Voltar</button><button type="button" className={dialog.nextStatus === "CANCELADA" ? styles.danger : styles.primary} disabled={pending} onClick={() => run(() => scheduleRequest(`sessions/${item.id_sessao}`, { method: dialog.nextStatus === "CANCELADA" ? "DELETE" : "PATCH", body: dialog.nextStatus === "CANCELADA" ? undefined : { status: dialog.nextStatus } }), dialog.nextStatus === "CANCELADA" ? "Sessão cancelada." : dialog.nextStatus === "EM_CARTAZ" ? "Sessão em cartaz." : "Sessão encerrada.")}>{pending ? "Aguarde…" : dialog.nextStatus === "CANCELADA" ? "Cancelar sessão" : dialog.nextStatus === "EM_CARTAZ" ? "Colocar em cartaz" : "Encerrar sessão"}</button></div></>}
    </DialogContent></Dialog>
  </ScheduleLayout>;
}
