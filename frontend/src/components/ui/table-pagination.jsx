'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './table-pagination.module.css';

export default function TablePagination({ list, noun = 'registros', pageSizes = [10, 20, 50, 100] }) {
  const busy = Boolean(list.loading || list.loadingMore);
  const start = list.items.length ? (list.page - 1) * list.pageSize + 1 : 0;
  const totalPages = Number.isInteger(list.totalPages) ? list.totalPages
    : Number.isInteger(list.total) ? Math.max(1, Math.ceil(list.total / list.pageSize)) : null;
  const last = totalPages ?? Math.max(list.page + Number(Boolean(list.hasNext)), list.visitedPages ?? 1);
  const pages = last <= 5 ? Array.from({ length:last }, (_, index) => index + 1)
    : [...new Set([1, list.page - 1, list.page, list.page + 1, last].filter(page => page > 0 && page <= last))].sort((a,b) => a-b);
  const label = `Página ${list.page}${totalPages ? ` de ${totalPages}` : ''}`;
  return <nav className={styles.pagination} aria-label={`Paginação de ${noun}`} aria-busy={busy}>
    <span className={styles.summary} role="status" aria-live="polite">{busy ? 'Carregando…' : list.error ? `Página ${list.page} indisponível` : !start ? 'Sem resultados nesta página' : `${start}–${start + list.items.length - 1}${Number.isInteger(list.total) ? ` de ${list.total}` : ''} ${noun} · ${label}`}</span>
    <label className={styles.size}>Por página<select value={list.pageSize} onChange={event => list.setPageSize(Number(event.target.value))} disabled={busy}>
      {pageSizes.map(size => <option key={size} value={size}>{size}</option>)}
    </select></label>
    <div className={styles.buttons}>
      <button type="button" disabled={busy || list.page === 1} onClick={list.previousPage} aria-label="Página anterior"><ChevronLeft size={16} aria-hidden="true" /><span>Anterior</span></button>
      {pages.map((page, index) => <span className={styles.numberGroup} key={page}>
        {index > 0 && page - pages[index - 1] > 1 && <span className={styles.ellipsis} aria-hidden="true">…</span>}
        <button type="button" aria-current={page === list.page ? 'page' : undefined} aria-label={`Página ${page}`} disabled={busy || page === list.page} onClick={() => list.goToPage(page)}>{page}</button>
      </span>)}
      <button type="button" disabled={busy || !list.hasNext} onClick={list.nextPage} aria-label="Próxima página"><span>Próxima</span><ChevronRight size={16} aria-hidden="true" /></button>
    </div>
  </nav>;
}
