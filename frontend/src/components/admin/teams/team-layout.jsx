'use client';

import TablePagination from '@/components/ui/table-pagination';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import page from '../tabelaexemplo/example-table.module.css';
import styles from '../catalog/catalog.module.css';

const sections = [
  { href: '/admin/equipes', label: 'Equipes' },
  { href: '/admin/equipes/membros', label: 'Membros' },
  { href: '/admin/equipes/entradas', label: 'Entradas' },
  { href: '/admin/equipes/chamados', label: 'Chamados' }
];
export const label = value => String(value ?? '—').replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/^./, letter => letter.toLocaleUpperCase('pt-BR'));
export const dateTime = value => {
  if (!value) return '—';
  const date = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function TeamLayout({ title, description, action, teamId, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={page.page}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    <nav className={styles.tabs} aria-label="Seções de Equipes">{sections.map(section => <Link key={section.href} href={`${section.href}${teamId && section.href !== '/admin/equipes' ? `?teamId=${teamId}` : ''}`} aria-current={pathname === section.href ? 'page' : undefined}>{section.label}</Link>)}</nav>
    {children}
  </main>;
}

export function TeamPicker({ scope }) {
  return <div className={styles.filmPicker}><h2>Equipe selecionada</h2><div className={styles.pickerControl}><label>Equipe<select value={scope.teamId} onChange={event => scope.selectTeam(event.target.value)} disabled={scope.teams.loading || !scope.teams.items.length && !scope.team}><option value="">Selecione uma equipe</option>{scope.teamId && !scope.teams.items.some(row => row.id_equipe === scope.teamId) && <option value={scope.teamId}>{scope.team?.nome ?? 'Equipe'} · #{scope.teamId}</option>}{scope.teams.items.map(row => <option key={row.id_equipe} value={row.id_equipe}>{row.nome} · #{row.id_equipe}</option>)}</select></label>{scope.teams.nextCursor && <button type="button" className={styles.secondary} onClick={scope.teams.loadMore} disabled={scope.teams.loadingMore}>{scope.teams.loadingMore ? 'Carregando…' : 'Mais equipes'}</button>}</div>{scope.teams.error && <p className={styles.error} role="alert">{scope.teams.error}</p>}{!scope.teams.loading && !scope.teams.items.length && !scope.teams.error && <p className={styles.hint}>Cadastre uma equipe para gerenciar esta seção.</p>}</div>;
}

export function TeamState({ list, empty, noun }) {
  if (list.loading) return <p className={styles.state} role="status">Carregando {noun}…</p>;
  if (list.error && !list.items.length) return <div className={styles.state} role="alert"><p>{list.error}</p><button type="button" onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={styles.state}>{empty}</p>;
  return null;
}

export function TeamFooter({ list, noun }) { return <TablePagination list={list} noun={noun} />; }
