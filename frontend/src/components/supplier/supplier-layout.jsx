'use client';

import TablePagination from '@/components/ui/table-pagination';
import page from '@/components/admin/tabelaexemplo/example-table.module.css';
import styles from '@/components/admin/catalog/catalog.module.css';
import portal from './supplier-portal.module.css';

export default function SupplierLayout({ title, description, action, children }) {
  return <main id="supplier-content" tabIndex={-1} className={`${page.page} ${portal.page}`}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    {children}
  </main>;
}

export function SupplierState({ list, noun, empty }) {
  if (list.loading) return <p className={styles.state} role="status">Carregando {noun}…</p>;
  if (list.error) return <div className={styles.state} role="alert"><p>{list.error}</p><button type="button" className={styles.secondary} onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={styles.state}>{empty}</p>;
  return null;
}

export function More({ list, noun }) {
  return <TablePagination list={list} noun={noun} />;
}

export const statusName = value => String(value ?? '—').replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/^./, letter => letter.toLocaleUpperCase('pt-BR'));
export const dateTime = value => value ? new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
