"use client";

import { useAdminSchedule } from "@/hooks/admin/use-admin-schedule";
import ScheduleLayout, { ScheduleState } from "./schedule-layout";
import SessionPicker, { useSessionSelection } from "./session-picker";
import styles from "../catalog/catalog.module.css";

const statusName = { GERADO: "Gerado", UTILIZADO: "Utilizado", EXPIRADO: "Expirado", CANCELADO: "Cancelado" };
const presenceName = { DENTRO: "Dentro", FORA: "Fora" };
const typeName = { INGRESSO_SESSAO: "Ingresso", RETIRADA_INSUMO: "Retirada" };
const dateTime = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function TicketsAdmin() {
  const selection = useSessionSelection();
  const session = selection.selected;
  const tickets = useAdminSchedule(session ? `sessions/${session.id_sessao}/tickets?limit=20` : null);
  return <ScheduleLayout title="Ingressos" description="Consulte os ingressos e tickets de retirada vinculados a cada sessão.">
    <SessionPicker selection={selection} />
    <section className={styles.panel} aria-labelledby="tickets-title"><header className={styles.panelHeader}><div><h2 id="tickets-title">{session ? `Ingressos · sessão #${session.id_sessao}` : "Ingressos da sessão"}</h2><p>{session ? `${session.titulo_filme ?? `Filme #${session.id_filme}`} · ${session.data?.slice(0, 10)} às ${session.horario_inicio?.slice(0, 5)} · ${session.nome_sala ?? `sala #${session.id_sala}`}` : "Selecione uma sessão para consultar os ingressos."}</p></div>{session && <span className={styles.count}>{tickets.items.length} carregados</span>}</header>
      {!session && <p className={styles.state}>Selecione uma sessão acima para começar.</p>}
      {session && <><ScheduleState list={tickets} empty="Esta sessão ainda não tem ingressos emitidos." noun="ingressos" />
        {tickets.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de ingressos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Ingressos da sessão {session.id_sessao}</caption><thead><tr><th scope="col">Ticket</th><th scope="col">Tipo</th><th scope="col">Item do pedido</th><th scope="col">Unidade</th><th scope="col">Status</th><th scope="col">Presença</th><th scope="col">Utilizado em</th><th scope="col">Válido até</th></tr></thead><tbody>{tickets.items.map((ticket) => <tr key={ticket.id}><th scope="row">#{ticket.id}</th><td>{typeName[ticket.type] ?? ticket.type}</td><td>#{ticket.itemId}</td><td>{ticket.unit}</td><td><span className={`${styles.badge} ${ticket.status !== "GERADO" ? styles.inactive : ""}`}>{statusName[ticket.status] ?? ticket.status}</span></td><td>{presenceName[ticket.presence] ?? "—"}</td><td className={styles.muted}>{dateTime(ticket.usedAt)}</td><td className={styles.muted}>{dateTime(ticket.expiresAt)}</td></tr>)}</tbody></table></div>}
        <footer className={styles.footer}><span>Exibindo {tickets.items.length} ingressos{tickets.nextCursor ? " · há mais registros" : ""}</span><button type="button" onClick={tickets.loadMore} disabled={!tickets.nextCursor || tickets.loadingMore}>{tickets.loadingMore ? "Carregando…" : "Carregar mais"}</button></footer></>}
    </section>
  </ScheduleLayout>;
}
