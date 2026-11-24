"use client";

import MoneyInput from "@/components/ui/money-input";

import TablePagination from '@/components/ui/table-pagination';
import Link from "next/link";
import { useRef, useState } from "react";
import { Archive, Check, CircleStop, ClipboardList, Pencil, Play, Plus, Ticket, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminCatalogList } from "@/hooks/admin/use-admin-catalog";
import { useAdminVenues } from "@/hooks/admin/use-admin-venues";
import { scheduleRequest, useAdminSchedule } from "@/hooks/admin/use-admin-schedule";
import ScheduleSelect from "./schedule-select";
import ScheduleLayout, { ScheduleState } from "./schedule-layout";
import SessionContext, { sessionHref, useSessionContext } from "@/components/session-context/session-context";
import styles from "../catalog/catalog.module.css";

const states = { AGENDADA: "Agendada", ATRASADA: "Atrasada", EM_CARTAZ: "Em cartaz", EXPIRADA: "Expirada", INTERROMPIDA: "Interrompida", ENCERRADA: "Encerrada", CANCELADA: "Cancelada" };
const transitionCopy = {
  EM_CARTAZ: ['Colocar em cartaz','Colocar esta sessão em cartaz?','Sessão em cartaz.'],
  ENCERRADA: ['Encerrar sessão','Encerrar esta sessão?','Sessão encerrada.'],
  INTERROMPIDA: ['Interromper sessão','As vendas serão suspensas. Pagamentos efetuados seguem para análise de reembolso.','Sessão interrompida.'],
  CANCELADA: ['Cancelar sessão','As vendas serão suspensas. Pagamentos efetuados de sessões em andamento seguem para análise de reembolso.','Sessão cancelada.'],
  ARCHIVE: ['Arquivar sessão','A sessão ficará disponível no Arquivo com seu histórico.','Sessão arquivada.'],
};
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
  const selection = useSessionContext(scheduleRequest);
  const [visibilityChoice, setVisibility] = useState(null);
  const visibility = visibilityChoice ?? (selection.session?.arquivada_em ? 'archived' : 'programming');
  const [localOverride, setLocalId] = useState(null);
  const localId = localOverride ?? selection.localId;
  const [formLocalId, setFormLocalId] = useState("");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const params = new URLSearchParams({ limit: "20", visibility });
  if (date) params.set("date", date);
  if (status !== "Todos") params.set("operationalStatus", status);
  if (localId) params.set("localId", localId);
  const list = useAdminSchedule(selection.loading ? null : `sessions?${params}`);
  const films = useAdminCatalogList(dialog?.type === "form" ? "films?limit=100&status=ATIVO&cinema=true" : null);
  const locals = useAdminVenues("locations?limit=20", { itemKey: "id_local" });
  const rooms = useAdminVenues(dialog?.type === "form" && formLocalId ? `locations/${formLocalId}/rooms?limit=20&status=ATIVA` : null, { itemKey: "id_sala" });
  const item = dialog?.item;
  const next = dialog?.nextStatus;

  function open(type, session = null, nextStatus = null) { setError(""); setNotice(""); setFormLocalId(session?.id_local ?? ""); setDialog({ type, item: session, nextStatus }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try { await task(); setDialog(null); setNotice(message); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  function transition() {
    const path = `sessions/${item.id_sessao}`;
    const [endpoint, options] = {
      ARCHIVE: [`${path}/archive`, { method:"POST", body:{} }],
      CANCELADA: [path, { method:"DELETE" }],
    }[next] ?? [path, { method:"PATCH", body:{ status:next } }];
    run(() => scheduleRequest(endpoint, options), transitionCopy[next][2]);
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

  return <ScheduleLayout title="Sessões" description="Programe exibições e acompanhe o estado de cada sessão." sessionSelected={Boolean(selection.session || selection.loading)} action={visibility === "programming" && <button type="button" className={styles.primary} onClick={() => open("form")}><Plus size={16} aria-hidden="true" />Nova sessão</button>}>
    <SessionContext selection={selection} area="admin" active="sessions" />
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="sessions-title"><header className={styles.panelHeader}><div><h2 id="sessions-title">{visibility === "archived" ? "Sessões arquivadas" : "Programação"}</h2><p>Horários, ingressos e registros de presença por sessão.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className={styles.filter}>Cinema<ScheduleSelect value={localId} onChange={(event) => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</ScheduleSelect></label><label className={styles.filter}>Status<ScheduleSelect value={status} onChange={(event) => setStatus(event.target.value)}><option value="Todos">Todos</option>{Object.entries(states).filter(([key]) => visibility !== "archived" || ["ENCERRADA","CANCELADA"].includes(key)).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</ScheduleSelect></label><label className={styles.filter}>Exibir<ScheduleSelect value={visibility} onChange={(event) => { setVisibility(event.target.value); setStatus("Todos"); }}><option value="programming">Programação</option><option value="archived">Arquivo</option></ScheduleSelect></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>{locals.loadingMore ? "Carregando…" : "Mais cinemas"}</button>}</div>
      <ScheduleState list={list} empty="Nenhuma sessão encontrada para estes filtros." noun="sessões" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de sessões; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Sessões programadas</caption><thead><tr><th scope="col">Filme</th><th scope="col">Cinema</th><th scope="col">Sala vinculada</th><th scope="col">Data e horário</th><th scope="col">Idioma</th><th scope="col">Inteira</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{list.items.map((row) => <tr key={row.id_sessao}><th scope="row">{row.titulo_filme ?? filmName(row.id_filme)}<small className={styles.muted}> · #{row.id_sessao}</small></th><td>{row.nome_local ?? localName(row.id_local)}</td><td><Link className="font-semibold text-primary underline underline-offset-4" href={`/admin/locais/assentos?local=${row.id_local}&sala=${row.id_sala}`}>{row.nome_sala ?? `Sala #${row.id_sala}`}</Link></td><td>{row.data?.slice(0, 10)}<br /><span className={styles.muted}>{row.horario_inicio?.slice(0, 5)}–{row.horario_fim?.slice(0, 5)}</span></td><td>{languages[row.idioma] ?? row.idioma}</td><td>R$ {Number(row.preco_inteira).toFixed(2).replace(".", ",")}</td><td><span className={`${styles.badge} ${["CANCELADA", "ENCERRADA"].includes(row.status) ? styles.inactive : ""}`}>{states[row.status_operacional ?? row.status] ?? row.status}</span></td><td><div className={styles.actions}>
        <button type="button" className={styles.iconButton} title="Editar sessão" aria-label={`Editar sessão ${row.id_sessao}`} disabled={row.status !== "AGENDADA"} onClick={() => open("form", row)}><Pencil size={16} aria-hidden="true" /></button>
        <Link prefetch={false} className={styles.iconButton} href={sessionHref('admin','tickets',row)} title="Ver ingressos" aria-label={`Ingressos da sessão ${row.id_sessao}`}><Ticket size={16} aria-hidden="true" /></Link>
        <Link prefetch={false} className={styles.iconButton} href={sessionHref('admin','presence',row)} title="Ver presença" aria-label={`Presença da sessão ${row.id_sessao}`}><ClipboardList size={16} aria-hidden="true" /></Link>
        {row.status === "AGENDADA" && row.status_operacional !== "EXPIRADA" && <button type="button" className={styles.iconButton} title="Colocar em cartaz" aria-label={`Colocar sessão ${row.id_sessao} em cartaz`} onClick={() => open("transition", row, "EM_CARTAZ")}><Play size={16} aria-hidden="true" /></button>}
        {row.status === "EM_CARTAZ" && <button type="button" className={styles.iconButton} title="Encerrar sessão" aria-label={`Encerrar sessão ${row.id_sessao}`} onClick={() => open("transition", row, "ENCERRADA")}><Check size={16} aria-hidden="true" /></button>}
        {["AGENDADA", "EM_CARTAZ", "INTERROMPIDA"].includes(row.status) && <button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Cancelar sessão" aria-label={`Cancelar sessão ${row.id_sessao}`} onClick={() => open("transition", row, "CANCELADA")}><XCircle size={16} aria-hidden="true" /></button>}
        {row.status === "EM_CARTAZ" && <button type="button" className={styles.iconButton} title="Interromper sessão" aria-label="Interromper sessão" onClick={() => open("transition", row, "INTERROMPIDA")}><CircleStop size={16} aria-hidden="true" /></button>}
        {!row.arquivada_em && ["ENCERRADA","CANCELADA"].includes(row.status) && <button type="button" className={styles.iconButton} title="Arquivar sessão" aria-label="Arquivar sessão" onClick={() => open("transition", row, "ARCHIVE")}><Archive size={16} aria-hidden="true" /></button>}
      </div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === "transition" ? `${transitionCopy[next][0]} · sessão #${item?.id_sessao}` : item ? "Editar sessão" : "Nova sessão"}</DialogTitle>
      {dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>A sala precisa estar ativa e com assentos cadastrados. Deixe ao menos uma hora entre sessões do mesmo cinema.</DialogDescription><form key={item?.id_sessao ?? "new"} className={styles.form} onSubmit={save}>
        <label className={styles.wide}>Filme<ScheduleSelect name="id_filme" required defaultValue={item?.id_filme ?? ""}><option value="">{films.loading ? "Carregando filmes…" : "Selecione um filme"}</option>{item && !films.items.some((film) => film.id_filme === item.id_filme) && <option value={item.id_filme}>{filmName(item.id_filme)}</option>}{films.items.map((film) => <option key={film.id_filme} value={film.id_filme}>{film.titulo}</option>)}</ScheduleSelect></label>
        {!item && <><label>Cinema<ScheduleSelect value={formLocalId} onChange={(event) => setFormLocalId(event.target.value)} required aria-busy={locals.loading}><option value="">{locals.loading ? "Carregando cinemas…" : "Selecione um cinema"}</option>{locals.items.filter((local) => local.status === "ATIVO").map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</ScheduleSelect></label><label>Sala<ScheduleSelect key={formLocalId} name="id_sala" required disabled={!formLocalId || rooms.loading || !rooms.items.length} aria-busy={rooms.loading}><option value="">{!formLocalId ? "Escolha um cinema" : rooms.loading ? "Carregando salas…" : rooms.error ? "Salas indisponíveis" : rooms.items.length ? "Selecione uma sala" : "Nenhuma sala ativa"}</option>{rooms.items.map((room) => <option key={room.id_sala} value={room.id_sala}>{room.nome} · {room.tipo} · {room.capacidade} lugares</option>)}</ScheduleSelect></label></>}
        {item && <div className={`${styles.state} ${styles.wide}`}>
          <p className={styles.muted}>Sala vinculada · {item.nome_local ?? localName(item.id_local)}</p>
          <Link className="font-semibold text-primary underline underline-offset-4" href={`/admin/locais/assentos?local=${item.id_local}&sala=${item.id_sala}`}>{item.nome_sala ?? `Sala #${item.id_sala}`}</Link>
        </div>}
        <label>Data<input name="data" type="date" required defaultValue={item?.data?.slice(0, 10) ?? ""} /></label><label>Idioma<ScheduleSelect name="idioma" defaultValue={item?.idioma ?? "DUBLADO"}>{Object.entries(languages).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</ScheduleSelect></label>
        <label>Início<input name="horario_inicio" type="time" required defaultValue={item?.horario_inicio?.slice(0, 5) ?? ""} /></label><label>Fim<input name="horario_fim" type="time" required defaultValue={item?.horario_fim?.slice(0, 5) ?? ""} /></label>
        <label>Preço da inteira (R$)<MoneyInput name="preco_inteira" required defaultValue={item?.preco_inteira ?? ""} /></label>
        <div className={`${styles.dialogActions} ${styles.wide}`}>{films.nextCursor && <button type="button" className={styles.secondary} onClick={films.loadMore} disabled={films.loadingMore}>Mais filmes</button>}{rooms.nextCursor && <button type="button" className={styles.secondary} onClick={rooms.loadMore} disabled={rooms.loadingMore}>Mais salas</button>}{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>{locals.loadingMore ? "Carregando…" : "Mais cinemas"}</button>}</div>
        {[[films, "filmes"], [locals, "cinemas"], [rooms, "salas"]].filter(([lookup, name]) => lookup.error && (!item || name === "filmes")).map(([lookup, name]) => <div key={name} className={styles.wide}><p className={styles.error} role="alert">Falha ao carregar {name}. {lookup.error}</p><button type="button" className={styles.secondary} onClick={lookup.reload}>Recarregar {name}</button></div>)}
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending || (!item && (!formLocalId || rooms.loading || !rooms.items.length))}>{pending ? "Salvando…" : item ? "Salvar alterações" : "Agendar sessão"}</button></div>
      </form></>}
      {next && <><DialogDescription className={styles.dialogDescription}>{transitionCopy[next][1]}</DialogDescription>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Voltar</button><button type="button" className={next === "CANCELADA" ? styles.danger : styles.primary} disabled={pending} onClick={transition}>{pending ? "Aguarde…" : transitionCopy[next][0]}</button></div></>}
    </DialogContent></Dialog>
  </ScheduleLayout>;
}
