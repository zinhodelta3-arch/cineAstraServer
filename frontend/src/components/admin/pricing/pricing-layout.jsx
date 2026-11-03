'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import page from '../tabelaexemplo/example-table.module.css';
import styles from '../catalog/catalog.module.css';

export const categories = { SESSION: 'Sessão', INPUT: 'Insumo', COMBO: 'Combo', RENTAL: 'Aluguel', PURCHASE: 'Compra digital', PLAN: 'Plano' };
const sections = [
  { href: '/admin/precificacao', label: 'Parâmetros' },
  { href: '/admin/precificacao/custos', label: 'Custos e preços' },
  { href: '/admin/precificacao/promocoes', label: 'Promoções' },
  { href: '/admin/precificacao/cupons', label: 'Cupons' }
];

export default function PricingLayout({ title, description, action, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={page.page}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    <nav className={styles.tabs} aria-label="Seções de Precificação">{sections.map(section => <Link key={section.href} href={section.href} aria-current={pathname === section.href ? 'page' : undefined}>{section.label}</Link>)}</nav>
    {children}
  </main>;
}

export function PricingState({ list, empty, noun }) {
  if (list.loading) return <p className={styles.state} role="status">Carregando {noun}…</p>;
  if (list.error) return <div className={styles.state} role="alert"><p>{list.error}</p><button type="button" onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={styles.state}>{empty}</p>;
  return null;
}

export const percent = bps => `${(Number(bps ?? 0) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
export const money = value => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
export const toBps = (value, max = 10000) => {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(text)) throw new Error('Informe percentuais com até duas casas decimais.');
  const bps = Math.round(Number(text) * 100);
  if (bps > max) throw new Error('Percentual acima do limite permitido.');
  return bps;
};
export const utcTime = value => new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value);
export const localDateTime = value => {
  if (!value) return '';
  const date = utcTime(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const dateTime = value => value ? utcTime(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
