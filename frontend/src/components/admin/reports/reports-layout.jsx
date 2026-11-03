'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import page from '../tabelaexemplo/example-table.module.css';
import styles from '../catalog/catalog.module.css';

const sections = [
  { href: '/admin/relatorios', label: 'Financeiro' },
  { href: '/admin/relatorios/destinacao-social', label: 'Destinação social' },
  { href: '/admin/relatorios/auditoria', label: 'Auditoria' },
  { href: '/admin/relatorios/http', label: 'Logs HTTP' }
];

export default function ReportsLayout({ title, description, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={page.page}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div></header>
    <nav className={styles.tabs} aria-label="Seções de Relatórios e auditoria">{sections.map(section => <Link key={section.href} href={section.href} aria-current={pathname === section.href ? 'page' : undefined}>{section.label}</Link>)}</nav>
    {children}
  </main>;
}

export function ReportFilters({ range, onSubmit, children }) {
  return <form className={styles.toolbar} onSubmit={event => { event.preventDefault(); onSubmit(); }}>
    <label className={styles.filter}>De<input type="date" value={range.from} onChange={event => range.setFrom(event.target.value)} min="1000-01-01" max="9999-12-30" required /></label>
    <label className={styles.filter}>Até<input type="date" value={range.to} onChange={event => range.setTo(event.target.value)} min="1000-01-01" max="9999-12-30" required /></label>
    {children}<button type="submit" className={styles.primary}>Aplicar filtros</button>
    {range.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{range.error}</p>}
  </form>;
}

export function ReportState({ report, empty = 'Nenhum registro encontrado.' }) {
  if (report.loading) return <p className={styles.state} role="status">Carregando dados…</p>;
  if (report.error && !report.data) return <div className={styles.state} role="alert"><p>{report.error}</p><button type="button" onClick={report.reload}>Tentar novamente</button></div>;
  if (!report.data) return <p className={styles.state}>{empty}</p>;
  return null;
}

export const money = value => {
  const match = /^(-?)(\d+)\.(\d{2})$/.exec(String(value ?? ''));
  return match ? `${match[1] ? '−' : ''}R$ ${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${match[3]}` : '—';
};
export const count = value => { try { return BigInt(value ?? 0).toLocaleString('pt-BR'); } catch { return '—'; } };
export const utcDateTime = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : `${date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'UTC' })} UTC`;
};
