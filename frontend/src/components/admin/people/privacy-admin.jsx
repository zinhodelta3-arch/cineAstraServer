'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { peopleRequest, useAdminPeople } from '@/hooks/admin/use-admin-people';
import PeopleLayout, { dateTime, PeopleState, statusName } from './people-layout';
import styles from '../catalog/catalog.module.css';

const statuses = ['RECEBIDA', 'EM_ANALISE', 'CONCLUIDA', 'RECUSADA'];
const pendingLabels = {
  subscription: 'Assinatura ativa ou pendente', sharedSubscription: 'Participação em assinatura',
  orderPending: 'Compra pendente', upcomingTicket: 'Ingresso futuro', refundPending: 'Reembolso em andamento'
};

export default function PrivacyAdmin() {
  const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null), [detail, setDetail] = useState(null), [loadingDetail, setLoadingDetail] = useState(false), [detailError, setDetailError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const params = new URLSearchParams({ limit: '20' });
  if (search) params.set('q', search);
  if (status) params.set('status', status);
  const list = useAdminPeople(`privacy?${params}`);

  useEffect(() => {
    if (!selected) return;
    const abort = new AbortController();
    setDetail(null); setDetailError(''); setLoadingDetail(true);
    peopleRequest(`privacy/${selected.id}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setDetail(data);
    }).catch(cause => { if (!abort.signal.aborted) setDetailError(cause.message); }).finally(() => { if (!abort.signal.aborted) setLoadingDetail(false); });
    return () => abort.abort();
  }, [selected]);

  async function decide(event) {
    event.preventDefault();
    if (saving || !selected) return;
    const form = event.currentTarget;
    const input = new FormData(form);
    if (input.get('status') === 'CONCLUIDA' && input.get('confirm') !== 'EXCLUIR') {
      setDetailError('Digite EXCLUIR para confirmar a aprovação.');
      return;
    }
    setSaving(true);
    setDetailError('');
    try {
      await peopleRequest(`privacy/${selected.id}`, { method: 'PATCH', body: { status: input.get('status'), reason: input.get('reason').trim() } });
      setSelected(null);
      list.retry();
    } catch (cause) {
      setDetailError(cause.message);
      setDetail(await peopleRequest(`privacy/${selected.id}`).catch(() => detail));
    } finally { setSaving(false); }
  }

  return <PeopleLayout title="Privacidade" description="Acompanhe as solicitações de privacidade das contas.">
    <section className={styles.panel} aria-labelledby="privacy-title"><header className={styles.panelHeader}><div><h2 id="privacy-title">Solicitações de exclusão</h2><p>Consulte o estado e o histórico de cada solicitação.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <div className={styles.toolbar}><label className={styles.search}><Search size={15} aria-hidden="true" /><span className="sr-only">Buscar solicitações</span><input value={query} onChange={event => setQuery(event.target.value)} maxLength={150} placeholder="Nome ou e-mail" /></label><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label></div>
      <PeopleState list={list} empty="Nenhuma solicitação encontrada." noun="solicitações" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de solicitações; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Solicitações de privacidade</caption><thead><tr><th scope="col">Solicitação</th><th scope="col">Conta</th><th scope="col">Status</th><th scope="col">Recebida em</th><th scope="col">Encerrada em</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">#{row.id}<div className={styles.muted}>{statusName(row.type)}</div></th><td>{row.user?.name ?? `Conta #${row.user?.id ?? '—'}`}<div className={styles.muted}>{row.user?.email ?? '—'}</div></td><td><span className={`${styles.badge} ${row.status === 'CONCLUIDA' ? '' : styles.inactive}`}>{statusName(row.status)}</span></td><td>{dateTime(row.createdAt)}</td><td>{dateTime(row.closedAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver solicitação" aria-label={`Ver solicitação ${row.id}`} onClick={() => setSelected(row)}><Eye size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
      {list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={value => { if (!value && !saving) setSelected(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>Solicitação #{selected?.id}</DialogTitle><DialogDescription className={styles.dialogDescription}>{selected?.user?.name ?? 'Conta'} · {selected?.user?.email ?? ''}</DialogDescription>
      {loadingDetail && <p role="status">Carregando solicitação…</p>}{detailError && <p className={styles.error} role="alert">{detailError}</p>}
      {detail && <dl className={styles.detailGrid}><div><dt>Tipo</dt><dd>{statusName(detail.tipo)}</dd></div><div><dt>Status</dt><dd>{statusName(detail.status)}</dd></div><div><dt>Conta</dt><dd>#{detail.id_usuario}</dd></div><div><dt>Recebida em</dt><dd>{dateTime(detail.criada_em)}</dd></div><div><dt>Encerrada em</dt><dd>{dateTime(detail.encerrada_em)}</dd></div><div><dt>Motivo da decisão</dt><dd>{detail.motivo_decisao || '—'}</dd></div></dl>}
      {detail && ['RECEBIDA','EM_ANALISE'].includes(detail.status) && <>
        {detail.pending?.length > 0 && <div><strong>Pendências comerciais</strong><ul className="list-disc pl-5">{detail.pending.map(key => <li key={key}>{pendingLabels[key] ?? key}</li>)}</ul></div>}
        <form className={styles.form} onSubmit={decide}>
          <label className={styles.wide}>Decisão<select name="status" defaultValue="" required>
            <option value="">Escolha uma ação</option><option value="EM_ANALISE">Manter em análise</option><option value="RECUSADA">Recusar solicitação</option>
            <option value="CONCLUIDA" disabled={Boolean(detail.pending?.length)}>Aprovar exclusão e anonimizar dados</option>
          </select></label>
          <label className={styles.wide}>Justificativa visível ao cliente<textarea name="reason" minLength={5} maxLength={255} required /></label>
          <label className={styles.wide}>Para aprovar, digite EXCLUIR<input name="confirm" autoComplete="off" /></label>
          <div className={`${styles.dialogActions} ${styles.wide}`}><button type="submit" className={styles.primary} disabled={saving}>{saving ? 'Registrando…' : 'Confirmar decisão'}</button></div>
        </form>
      </>}
    </DialogContent></Dialog>
  </PeopleLayout>;
}
