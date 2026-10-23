"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Film, Ticket, Users, Wallet } from "lucide-react";
import styles from "./dashboard.module.css";

const brl = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
const integer = (value) => value.toLocaleString("pt-BR");
const periods = {
  week: { label: "Últimos 7 dias", tickets: 1840, revenue: 55200, occupancy: 72, sessions: 84, days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], sales: [160, 120, 180, 240, 320, 440, 380], rooms: [68, 84, 72, 64], split: [54, 32, 14] },
  month: { label: "Últimos 30 dias", tickets: 7920, revenue: 237600, occupancy: 76, sessions: 360, days: ["1–5", "6–10", "11–15", "16–20", "21–25", "26–30"], sales: [980, 1120, 1280, 1440, 1620, 1480], rooms: [74, 88, 78, 64], split: [48, 36, 16] },
};
const movies = [
  { name: "Duna: Parte Dois", genre: "Ficção científica", share: 0.34, color: "var(--chart-1)" },
  { name: "Interestelar", genre: "Aventura", share: 0.28, color: "var(--chart-2)" },
  { name: "Oppenheimer", genre: "Drama", share: 0.22, color: "var(--chart-3)" },
  { name: "Parasita", genre: "Suspense", share: 0.16, color: "var(--chart-4)" },
];
function Panel({ title, subtitle, className = "", children }) {
  return <section className={`${styles.panel} ${className}`}><header className={styles.panelHeader}><h2>{title}</h2><p>{subtitle}</p></header>{children}</section>;
}
function Bars({ labels, values, percent = false }) {
  const max = percent ? 100 : Math.ceil(Math.max(...values) / 100) * 100;
  return <div className={styles.bars} role="img" aria-label={labels.map((label, i) => `${label}: ${values[i]}${percent ? "% de ocupação" : " ingressos"}`).join("; ")}>
    <div className={styles.scale}><span>{integer(max)}{percent && "%"}</span><span>{integer(max / 2)}</span><span>0</span></div>
    <div className={styles.barPlot}>{values.map((value, i) => <div className={styles.barColumn} key={labels[i]}><span className={styles.barValue}>{integer(value)}{percent && "%"}</span><div className={styles.bar} style={{ height: `${value / max * 100}%`, background: percent ? "var(--chart-2)" : "var(--chart-1)" }} /><span className={styles.barLabel}>{labels[i]}</span></div>)}</div>
  </div>;
}

export default function Dashboard() {
  const [period, setPeriod] = useState("week");
  const data = periods[period];
  const maxRevenue = Math.ceil(Math.max(...data.sales) * 30 / 5000) * 5000;
  const points = data.sales.map((value, i) => `${45 + i * 535 / (data.sales.length - 1)},${148 - value * 30 / maxRevenue * 125}`).join(" ");
  const metrics = [
    { label: "Receita de bilheteria", value: brl(data.revenue), note: "Vendas de ingressos", icon: Wallet },
    { label: "Ingressos vendidos", value: integer(data.tickets), note: "Todos os tipos de ingresso", icon: Ticket },
    { label: "Ocupação média", value: `${data.occupancy}%`, note: "Capacidade das salas", icon: Users },
    { label: "Sessões realizadas", value: data.sessions, note: "Em todas as salas", icon: Film },
  ];
  return <main id="dashboard" tabIndex={-1} className={styles.dashboard}>
    <header className={styles.heading}>
      <div><h1>Seu cinema em <em>cena.</em></h1><p>Acompanhe a bilheteria, as salas e os filmes que movem o público.</p></div>
      <label className={styles.period}><CalendarDays size={18} aria-hidden="true" /><span className="sr-only">Período dos indicadores</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="week">Últimos 7 dias</option><option value="month">Últimos 30 dias</option></select></label>
    </header>
    <div className={styles.filmStrip} aria-hidden="true" />
    <div className={styles.context}><span className={styles.demo}>Dados demonstrativos</span><p>Prévia do dashboard · sem conexão com a bilheteria</p></div>
    <section className={styles.metrics} aria-label={`Indicadores: ${data.label}`} aria-live="polite">
      {metrics.map(({ label, value, note, icon: Icon }) => <article className={styles.metric} key={label}><div><span>{label}</span><Icon size={19} aria-hidden="true" /></div><strong>{value}</strong><p>{note}</p></article>)}
    </section>
    <div className={styles.charts}>
      <Panel title="O público da vez" subtitle={`Ingressos por ${period === "week" ? "dia da semana" : "intervalo de 5 dias"}`}><Bars labels={data.days} values={data.sales} /></Panel>
      <Panel title="De olho nas salas" subtitle="Ocupação média por sala"><Bars labels={["Sala 1", "Sala 2", "Sala 3", "Sala 4"]} values={data.rooms} percent /></Panel>
      <Panel title="Cada ingresso conta" subtitle="Distribuição por tipo de entrada" className={styles.piePanel}>
        <div className={styles.donut} role="img" aria-label={`Inteira: ${data.split[0]}%; meia-entrada: ${data.split[1]}%; promocional: ${data.split[2]}%`} style={{ background: `conic-gradient(var(--chart-1) 0 ${data.split[0]}%, var(--chart-2) ${data.split[0]}% ${data.split[0] + data.split[1]}%, var(--chart-3) ${data.split[0] + data.split[1]}% 100%)` }}><div><strong>{integer(data.tickets)}</strong><span>ingressos</span></div></div>
        <ul className={styles.legend}>{["Inteira", "Meia-entrada", "Promocional"].map((label, i) => <li key={label}><span className={styles.dot} style={{ background: `var(--chart-${i + 1})` }} /><span>{label}</span><strong>{data.split[i]}%</strong></li>)}</ul>
        <p className={styles.pieNote}>Cada lugar ocupado faz parte dessa história.</p>
      </Panel>
      <Panel title="A bilheteria em movimento" subtitle={`Receita de ingressos · ${data.label.toLowerCase()}`} className={styles.linePanel}>
        <svg className={styles.lineChart} viewBox="0 0 610 185" role="img" aria-label={data.days.map((day, i) => `${day}: ${brl(data.sales[i] * 30)}`).join("; ")}>
          {[0, 1, 2].map((i) => <g key={i}><line x1="45" x2="580" y1={23 + i * 62.5} y2={23 + i * 62.5} stroke="var(--border)" strokeDasharray="3 5" /><text x="0" y={27 + i * 62.5}>{maxRevenue / 1000 * (1 - i / 2)} mil</text></g>)}
          <polygon points={`45,148 ${points} 580,148`} fill="var(--primary)" opacity=".09" /><polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
          {data.sales.map((value, i) => <g key={data.days[i]}><circle cx={45 + i * 535 / (data.sales.length - 1)} cy={148 - value * 30 / maxRevenue * 125} r="4" fill="var(--primary)" /><text x={45 + i * 535 / (data.sales.length - 1)} y="177" textAnchor="middle">{data.days[i]}</text></g>)}
        </svg>
        <span className={styles.chartCaption}>Valores em reais (R$)</span>
      </Panel>
    </div>
    <div className={styles.sectionHeading}><h2>Os protagonistas da programação</h2><span>Filmes e próximas sessões</span></div>
    <div className={styles.bottom}>
      <Panel title="Sucessos de bilheteria" subtitle="Os filmes mais vistos no período selecionado">
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Filme</th><th scope="col">Ingressos</th><th scope="col">Receita</th></tr></thead><tbody>{movies.map((movie) => <tr key={movie.name}><th scope="row"><span className={styles.movieName}>{movie.name}</span><span className={styles.genre}>{movie.genre}</span></th><td>{integer(Math.round(data.tickets * movie.share))}</td><td>{brl(Math.round(data.tickets * movie.share) * 30)}</td></tr>)}</tbody></table></div>
        <Link className={styles.link} href="/cinema/filmes">Explorar filmes em cartaz <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </Panel>
      <Panel title="A seguir, nas telas" subtitle="Exemplo da programação de hoje">
        <ol className={styles.sessions}>{[{ time: "18:30", film: "Duna: Parte Dois", room: "Sala 2 · IMAX · Legendado" }, { time: "19:00", film: "Interestelar", room: "Sala 1 · 2D · Legendado" }, { time: "20:15", film: "Oppenheimer", room: "Sala 3 · 2D · Dublado" }].map((session) => <li key={session.time}><time>{session.time}</time><div><strong>{session.film}</strong><span>{session.room}</span></div></li>)}</ol>
        <p className={styles.scheduleNote}>Horários ilustrativos. Consulte a programação no site do cinema.</p>
      </Panel>
    </div>
    <footer className={styles.footer}>CineAstra <span>O espetáculo também acontece nos bastidores.</span></footer>
  </main>;
}
