'use client';

import { Ticket } from 'lucide-react';
import styles from './unit.module.css';
import TablePagination from '@/components/ui/table-pagination';

export const label = value => String(value ?? '—').replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/^./, letter => letter.toLocaleUpperCase('pt-BR'));
export const dateTime = value => {
  if (!value) return '—';
  const date = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function UnitLayout({ title, description, location, children }) {
  return <main id="unit-content" tabIndex={-1} className={styles.page}>
    <div className={styles.eyebrow}><Ticket size={15} aria-hidden="true" />{location || 'Minha unidade'}</div>
    <header className={styles.heading}><div><h1>{title}</h1><p>{description}</p></div></header>
    {children}
  </main>;
}

export function UnitFeedback({ error, notice }) {
  return <>{error && <p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}{notice && <p className={styles.message} role="status">{notice}</p>}</>;
}

export function UnitListState({ list, empty }) {
  if (list.loading) return <p className={styles.empty} role="status">Carregando…</p>;
  if (list.error && !list.items.length) return <p className={`${styles.message} ${styles.error}`} role="alert">{list.error} <button type="button" className={styles.secondary} onClick={list.reload}>Tentar novamente</button></p>;
  if (!list.items.length) return <p className={styles.empty}>{empty}</p>;
  return null;
}

export function UnitMore({ list }) {
  return <TablePagination list={list} />;
}
