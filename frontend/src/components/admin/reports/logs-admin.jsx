'use client';

import { useState } from 'react';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { useAdminReport, useReportRange } from '@/hooks/admin/use-admin-reports';
import ReportsLayout, { ReportFilters, ReportState, utcDateTime } from './reports-layout';
import styles from '../catalog/catalog.module.css';

export default function LogsAdmin({ kind }) {
  const audit = kind === 'audit', range = useReportRange();
  const [actorId, setActorId] = useState(''), [eventType, setEventType] = useState(''), [status, setStatus] = useState('');
  const [filters, setFilters] = useState({}), [filterError, setFilterError] = useState('');
  const params = new URLSearchParams({ ...(range.applied ?? {}), ...filters, limit: '20' });
  const report = useAdminReport(range.applied ? `${kind}?${params}` : null);
  const items = report.data?.items ?? [];
  function apply() {
    const actor = actorId.trim(), event = eventType.trim().toUpperCase(), code = status.trim();
    if (actor && (!/^[1-9]\d{0,19}$/.test(actor) || BigInt(actor) > 18446744073709551615n)) { setFilterError('Informe um ID de usuário válido.'); return; }
    if (audit && event && !/^[A-Z][A-Z0-9_.]{0,79}$/.test(event)) { setFilterError('Use um tipo de evento válido, como ORDER.CREATED.'); return; }
    if (!audit && code && (!/^\d{3}$/.test(code) || Number(code) < 100 || Number(code) > 599)) { setFilterError('Informe um status HTTP entre 100 e 599.'); return; }
    setFilterError('');
    if (!range.commit()) return;
    const next = {};
    if (actor) next.actorId = actor;
    if (audit && event) next.eventType = event;
    if (!audit && code) next.status = code;
    setFilters(next);
  }

  return <ReportsLayout title={audit ? 'Auditoria' : 'Logs HTTP'} description={audit ? 'Consulte os eventos registrados pelas operações do sistema.' : 'Acompanhe as requisições e os tempos de resposta registrados.'}>
    <section className={styles.panel} aria-labelledby="logs-title"><header className={styles.panelHeader}><div><h2 id="logs-title">{audit ? 'Eventos de auditoria' : 'Requisições HTTP'}</h2><p>Horários e filtro de período em UTC.</p></div><span className={styles.count}>{items.length} carregados</span></header>
      <ReportFilters range={range} onSubmit={apply}><UserLookupFilter value={actorId} onChange={setActorId} allowHistoricalId />{audit ? <label className={styles.filter}>Tipo de evento<input value={eventType} onChange={event => setEventType(event.target.value.toUpperCase())} maxLength={80} placeholder="Ex.: ORDER.CREATED" /></label> : <label className={styles.filter}>Status HTTP<input inputMode="numeric" value={status} onChange={event => setStatus(event.target.value)} maxLength={3} placeholder="Todos" /></label>}{filterError && <p className={`${styles.error} ${styles.wide}`} role="alert">{filterError}</p>}</ReportFilters>
      {range.applied ? <ReportState report={report} /> : <p className={styles.state} role="status">Preparando período…</p>}
      {report.data && (items.length === 0 ? <p className={styles.state}>Nenhum registro encontrado neste período.</p> : <div className={styles.tableWrap} role="region" aria-label={`${audit ? 'Tabela de auditoria' : 'Tabela de logs HTTP'}; deslize horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><caption className="sr-only">{audit ? 'Eventos de auditoria' : 'Logs HTTP'}</caption><thead><tr>{audit ? <><th scope="col">Evento</th><th scope="col">Usuário</th><th scope="col">Registro</th><th scope="col">Requisição</th><th scope="col">Data</th></> : <><th scope="col">Método</th><th scope="col">Rota</th><th scope="col">Status</th><th scope="col">Tempo</th><th scope="col">Usuário</th><th scope="col">Data</th></>}</tr></thead><tbody>{items.map((row, index) => audit ? <tr key={`${row.requestId ?? ''}-${index}`}><th scope="row">{row.eventType}</th><td>{row.actorId ? `#${row.actorId}` : 'Sistema'}</td><td>{row.aggregateId ?? '—'}</td><td>{row.requestId ?? '—'}</td><td>{utcDateTime(row.occurredAt)}</td></tr> : <tr key={`${row.occurredAt ?? ''}-${index}`}><th scope="row">{row.method}</th><td>{row.route}</td><td><span className={`${styles.badge} ${row.statusCode >= 400 ? styles.inactive : ''}`}>{row.statusCode}</span></td><td>{row.elapsedMs == null ? '—' : `${row.elapsedMs} ms`}</td><td>{row.actorId ? `#${row.actorId}` : '—'}</td><td>{utcDateTime(row.occurredAt)}</td></tr>)}</tbody></table></div>)}
      {report.error && report.data && <p className={styles.error} role="alert">{report.error}</p>}
      {report.data && <footer className={styles.footer}><span>Exibindo {items.length} registros{report.data.pagination?.nextCursor ? ' · há mais' : ''}</span><button type="button" onClick={report.loadMore} disabled={!report.data.pagination?.nextCursor || report.loadingMore}>{report.loadingMore ? 'Carregando…' : 'Carregar mais'}</button></footer>}
    </section>
  </ReportsLayout>;
}
