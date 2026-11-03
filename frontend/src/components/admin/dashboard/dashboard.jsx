"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { CalendarDays, ChevronDown } from "lucide-react";
import MoviePerformanceTable from "./movie-performance-table";
import styles from "./dashboard.module.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const integer = (value) => BigInt(value).toLocaleString("pt-BR");
const shortDate = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const dayLabel = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "");
const compact = (value) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const typeNames = { INTEIRA: "Inteira", MEIA: "Meia-entrada", ISENTA: "Isenta", UNKNOWN: "Não identificado" };
const languages = { DUBLADO: "Dublado", LEGENDADO: "Legendado", ORIGINAL: "Original" };

function chartSeries(daily, period) {
  const values = daily.map((day) => ({ date: day.date, tickets: Number(day.tickets), revenue: Number(day.ticketSalesValue) }));
  if (period === "week") return values.map((day) => ({ ...day, label: dayLabel(day.date) }));
  const grouped = [];
  for (let index = 0; index < values.length; index += 5) {
    const days = values.slice(index, index + 5);
    const first = shortDate(days[0].date);
    const last = shortDate(days.at(-1).date);
    grouped.push({
      label: first.slice(3) === last.slice(3) ? `${first.slice(0, 2)}–${last}` : `${first}–${last}`,
      tickets: days.reduce((sum, day) => sum + day.tickets, 0),
      revenue: days.reduce((sum, day) => sum + day.revenue, 0),
    });
  }
  return grouped;
}

function Panel({ title, subtitle, className = "", children }) {
  return <section className={`${styles.panel} ${className}`}>
    <header className={styles.panelHeader}><h2>{title}</h2><p>{subtitle}</p></header>
    {children}
  </section>;
}

function RevenueChart({ series, total }) {
  const max = Math.max(...series.map((day) => day.revenue), 1);
  const coordinates = series.map((day, index) => ({ x: 38 + index * 562 / Math.max(series.length - 1, 1), y: 178 - day.revenue / max * 140 }));
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  return <div className={styles.revenueChart}>
    <div className={styles.chartTotal}><strong>{money(total)}</strong><span>no período selecionado</span></div>
    <svg viewBox="0 0 638 222" className={styles.lineChart} role="img" aria-label={series.map((day) => `${day.label}: ${money(day.revenue)}`).join("; ")}>
      {[0, 0.5, 1].map((step) => <g key={step}><line x1="38" x2="600" y1={178 - step * 140} y2={178 - step * 140} className={styles.gridLine} /><text x="0" y={182 - step * 140}>{compact(max * step)}</text></g>)}
      <polygon points={`38,178 ${points} 600,178`} className={styles.area} />
      <polyline points={points} className={styles.line} />
      {coordinates.map(({ x, y }, index) => <g key={series[index].label}><circle cx={x} cy={y} r="4" className={styles.point} /><text x={x} y="210" textAnchor="middle">{series[index].label}</text></g>)}
    </svg>
  </div>;
}

function TicketBars({ series }) {
  const max = Math.max(...series.map((day) => day.tickets), 1);
  return <div className={styles.ticketChart} role="img" aria-label={series.map((day) => `${day.label}: ${integer(day.tickets)} ingressos`).join("; ")}>
    {series.map((day) => <div className={styles.ticketColumn} key={day.label}><span className={styles.ticketValue}>{integer(day.tickets)}</span><div className={styles.ticketTrack}><span style={{ height: `${day.tickets / max * 100}%` }} /></div><span className={styles.ticketLabel}>{day.label}</span></div>)}
  </div>;
}

function RoomOccupancy({ rooms }) {
  const visible = [...rooms].sort((left, right) => Number(right.sessionCount) - Number(left.sessionCount)).slice(0, 4);
  if (!visible.length) return <p className={styles.panelState}>Nenhuma sala com sessões neste período.</p>;
  return <>
    <div className={styles.roomList} role="img" aria-label={visible.map((room) => `${room.locationName}, ${room.name}: ${room.occupancyPercent == null ? "sem capacidade registrada" : `${room.occupancyPercent}% de ocupação`}`).join("; ")}>
      {visible.map((room) => <div className={styles.roomRow} key={room.id}><span className={styles.roomName} title={`${room.locationName} · ${room.name}`}>{room.name}<small>{room.locationName}</small></span><div className={styles.roomTrack}><span style={{ width: `${Math.max(0, Math.min(100, room.occupancyPercent ?? 0))}%` }} /></div><strong>{room.occupancyPercent == null ? "—" : `${room.occupancyPercent}%`}</strong></div>)}
    </div>
    {rooms.length > visible.length && <p className={styles.roomNote}>Exibindo {visible.length} de {rooms.length} salas com mais sessões.</p>}
  </>;
}

function TicketTypes({ types }) {
  const visible = types.map((item, index) => ({ ...item, color: styles[`type${index + 1}`] })).filter((item) => Number(item.tickets) > 0);
  if (!visible.length) return <p className={styles.panelState}>Nenhum ingresso vendido neste período.</p>;
  return <div className={styles.ticketTypes}>
    <div className={styles.typeTrack} role="img" aria-label={visible.map((item) => `${typeNames[item.type] ?? item.type}: ${item.sharePercent}%`).join("; ")}>{visible.map((item) => <span className={item.color} style={{ flexGrow: Number(item.tickets) }} key={item.type} />)}</div>
    <ul className={styles.typeList}>{visible.map((item) => <li key={item.type}><span className={`${styles.typeDot} ${item.color}`} /><span>{typeNames[item.type] ?? item.type}</span><strong>{item.sharePercent?.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) ?? "0"}%</strong></li>)}</ul>
  </div>;
}

function UpcomingSessions({ sessions, loading, error }) {
  if (loading || error || !sessions.length) return <p className={styles.panelState}>{loading ? "Carregando sessões…" : error ? "Sessões indisponíveis no momento." : "Nenhuma sessão futura cadastrada."}</p>;
  return <ol className={styles.sessions}>{sessions.map((session) => <li key={session.id}>
    <time dateTime={`${session.date}T${session.startTime}`}>{shortDate(session.date)} <strong>{session.startTime.slice(0, 5)}</strong></time>
    <div><strong>{session.filmTitle}</strong><span>{session.locationName} · {session.roomName} · {languages[session.language] ?? session.language}</span></div>
  </li>)}</ol>;
}

export default function Dashboard() {
  const { period, setPeriod, report, loading, error, retry } = useDashboard();
  const label = period === "week" ? "Últimos 7 dias" : "Últimos 30 dias";
  const series = report ? chartSeries(report.daily, period) : [];
  const chartState = <p className={styles.panelState}>{loading ? "Carregando indicadores…" : error ? "Indicadores indisponíveis no momento." : "Nenhuma venda neste período."}</p>;
  const metrics = [
    { label: "Receita de bilheteria", value: report ? money(report.sales.ticketSalesValue) : "—", note: "Vendas de ingressos" },
    { label: "Ingressos vendidos", value: report ? integer(report.sales.tickets) : "—", note: "No período selecionado" },
    { label: "Ocupação média", value: report?.occupancy.occupancyPercent == null ? "—" : `${report.occupancy.occupancyPercent}%`, note: "Lugares confirmados" },
    { label: "Sessões realizadas", value: report ? integer(report.occupancy.completedSessions) : "—", note: "Sessões encerradas" },
  ];

  return <main id="admin-content" tabIndex={-1} className={styles.dashboard}>
    <header className={styles.heading}><div><h1>Visão geral</h1><p>Bilheteria, ocupação e programação em um só lugar.</p></div><label className={styles.period}><CalendarDays size={16} aria-hidden="true" /><span className="sr-only">Período dos indicadores</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="week">Últimos 7 dias</option><option value="month">Últimos 30 dias</option></select><ChevronDown size={15} aria-hidden="true" /></label></header>
    {error && <div className={styles.errorBanner} role="alert"><span>{error}</span><button type="button" onClick={retry}>Tentar novamente</button></div>}
    <section className={styles.metrics} aria-label={`Indicadores: ${label}`} aria-live="polite">{metrics.map(({ label: metricLabel, value, note }) => <article className={styles.metric} key={metricLabel}><span>{metricLabel}</span><strong>{value}</strong><p>{note}</p></article>)}</section>
    <Panel title="Próximas sessões" subtitle="Programação futura" className={styles.sessionsPanel}><UpcomingSessions sessions={report?.upcomingSessions ?? []} loading={loading} error={error} /></Panel>
    <div className={styles.charts}>
      <Panel title="Receita de ingressos" subtitle={`Evolução da bilheteria · ${label.toLowerCase()}`} className={styles.revenuePanel}>{series.some((day) => day.revenue > 0) ? <RevenueChart series={series} total={report.sales.ticketSalesValue} /> : chartState}</Panel>
      <Panel title="Ingressos vendidos" subtitle={period === "week" ? "Volume por dia da semana" : "Volume por intervalo de 5 dias"} className={styles.ticketsPanel}>{series.some((day) => day.tickets > 0) ? <TicketBars series={series} /> : chartState}</Panel>
      <Panel title="Ocupação por sala" subtitle="Salas com mais sessões no período">{report ? <RoomOccupancy rooms={report.rooms} /> : chartState}</Panel>
      <Panel title="Tipos de ingresso" subtitle="Distribuição dos ingressos vendidos">{report ? <TicketTypes types={report.ticketTypes} /> : chartState}</Panel>
    </div>
    <div className={styles.sectionHeading}><h2>Desempenho dos filmes</h2><span>Ranking por ingressos vendidos</span></div>
    <div className={styles.bottom}><Panel title="Filmes mais vendidos" subtitle={`Ingressos e receita · ${label.toLowerCase()}`} className={styles.movieTablePanel}><MoviePerformanceTable key={period} items={report?.topMovies ?? []} loading={loading} error={error} retry={retry} /></Panel></div>
  </main>;
}
