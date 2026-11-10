"use client";

import TablePagination from '@/components/ui/table-pagination';
import { useAdminSchedule } from "@/hooks/admin/use-admin-schedule";
import ScheduleLayout, { ScheduleState } from "./schedule-layout";
import SessionPicker, { useSessionSelection } from "./session-picker";
import styles from "../catalog/catalog.module.css";

const dateTime = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
const metrics = [
  { key: "total", label: "Ingressos" },
  { key: "entered", label: "Entradas" },
  { key: "inside", label: "Dentro da sala" },
  { key: "exited", label: "Saídas" },
  { key: "late", label: "Pendentes" },
];

export default function AttendanceAdmin() {
  const selection = useSessionSelection();
  const session = selection.selected;
  const attendance = useAdminSchedule(session ? `sessions/${session.id_sessao}/attendance?limit=20` : null);
  return <ScheduleLayout title="Presença" description="Acompanhe entradas e saídas registradas em cada sessão.">
    <SessionPicker selection={selection} />
    {session && attendance.summary && <section className={styles.summaryGrid} aria-label="Resumo de presença">{metrics.map((metric) => <div key={metric.key}><span>{metric.label}</span><strong>{attendance.summary[metric.key] ?? 0}</strong></div>)}</section>}
    <section className={styles.panel} aria-labelledby="attendance-title"><header className={styles.panelHeader}><div><h2 id="attendance-title">{session ? `Movimentações · sessão #${session.id_sessao}` : "Movimentações da sessão"}</h2><p>{session ? `${session.titulo_filme ?? `Filme #${session.id_filme}`} · ${session.data?.slice(0, 10)} às ${session.horario_inicio?.slice(0, 5)} · ${session.nome_sala ?? `sala #${session.id_sala}`}` : "Selecione uma sessão para consultar a presença."}</p></div>{session && <span className={styles.count}>{attendance.items.length} carregadas</span>}</header>
      {!session && <p className={styles.state}>Selecione uma sessão acima para começar.</p>}
      {session && <><ScheduleState list={attendance} empty="Ainda não há entradas ou saídas registradas para esta sessão." noun="movimentações" />
        {attendance.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de presença; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Registros de presença da sessão {session.id_sessao}</caption><thead><tr><th scope="col">Registro</th><th scope="col">Ingresso</th><th scope="col">Movimentação</th><th scope="col">Horário</th><th scope="col">Responsável</th></tr></thead><tbody>{attendance.items.map((entry) => <tr key={entry.id}><th scope="row">#{entry.id}</th><td>#{entry.ticketId}</td><td><span className={`${styles.badge} ${entry.type === "SAIDA" ? styles.inactive : ""}`}>{entry.type === "ENTRADA" ? "Entrada" : entry.type === "SAIDA" ? "Saída" : entry.type}</span></td><td>{dateTime(entry.at)}</td><td className={styles.muted}>{entry.staffId ? `Equipe #${entry.staffId}` : "—"}</td></tr>)}</tbody></table></div>}
        <TablePagination list={attendance} /></>}
    </section>
  </ScheduleLayout>;
}
