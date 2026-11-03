'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import page from '../tabelaexemplo/example-table.module.css';
import styles from '../catalog/catalog.module.css';

const sections = [
  { href: '/admin/streaming', label: 'Planos' },
  { href: '/admin/streaming/assinaturas', label: 'Assinaturas' },
  { href: '/admin/streaming/acessos', label: 'Acessos' }
];

export default function StreamingLayout({ title, description, action, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={page.page}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    <nav className={styles.tabs} aria-label="Seções de Streaming">{sections.map(section => <Link key={section.href} href={section.href} aria-current={pathname === section.href ? 'page' : undefined}>{section.label}</Link>)}</nav>
    {children}
  </main>;
}

export function StreamingState({ list, empty, noun }) {
  if (list.loading) return <p className={styles.state} role="status">Carregando {noun}…</p>;
  if (list.error) return <div className={styles.state} role="alert"><p>{list.error}</p><button type="button" onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={styles.state}>{empty}</p>;
  return null;
}

export const money = value => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
export const dateTime = value => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const dateOnly = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
export const statusName = value => String(value ?? '—').replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/^./, letter => letter.toLocaleUpperCase('pt-BR'));
