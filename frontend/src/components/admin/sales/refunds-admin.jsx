'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Scale } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { salesRequest, useAdminSales } from '@/hooks/admin/use-admin-sales';
import SalesLayout, { SalesState, dateTime, money, statusName } from './sales-layout';
import styles from '../catalog/catalog.module.css';

const statuses = ['RECEBIDA', 'EM_ANALISE', 'ENVIADA', 'CONFIRMADA', 'NEGADA', 'FALHOU'];
const reasons = ['ARREPENDIMENTO', 'DEFEITO', 'OUTRO', 'CANCELAMENTO_PLANO'];

export default function RefundsAdmin() {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [decision, setDecision] = useState('APPROVE');
  const lock = useRef(false);
  const params = new URLSearchParams({ limit: '20' });
  if (status) params.set('status', status);
  if (reason) params.set('reason', reason);
  const list = useAdminSales(`refunds?${params}`);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setDetail(null); setDetailLoading(true); setError('');
    salesRequest(`refunds/${selected.id}`).then(value => { if (active) setDetail(value); })
      .catch(cause => { if (active) setError(cause.message); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [selected?.id]);

  function open(row) { setNotice(''); setDecision('APPROVE'); setSelected(row); }
  function close() { if (!lock.current) setSelected(null); }
  async function decide(event) {
    event.preventDefault();
    if (!detail || detail.status !== 'EM_ANALISE' || lock.current) return;
    const form = new FormData(event.currentTarget);
    const amount = String(form.get('amount') ?? '').trim().replace(',', '.');
    const termsVersion = String(form.get('termsVersion') ?? '').trim();
    const basis = String(form.get('basis') ?? '').trim();
    if (basis.length < 10 || basis.length > 1000 || !termsVersion || termsVersion.length > 50) { setError('Informe a versão dos termos e uma justificativa de 10 a 1000 caracteres.'); return; }
    if (decision === 'APPROVE' && (!/^(0|[1-9]\d{0,7})\.\d{2}$/.test(amount) || amount === '0.00')) { setError('Informe o valor aprovado com duas casas decimais.'); return; }
    lock.current = true; setPending(true); setError('');
    try {
      await salesRequest(`refunds/${detail.id}/decision`, { method: 'POST', body: { decision, ...(decision === 'APPROVE' ? { amount } : {}), termsVersion, basis } });
      setSelected(null); setNotice('Decisão registrada.'); list.reload();
    } catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  return <SalesLayout title="Reembolsos" description="Acompanhe solicitações e registre decisões quando estiverem em análise.">
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="refund-list-title"><header className={styles.panelHeader}><div><h2 id="refund-list-title">Solicitações de reembolso</h2><p>Consulte o motivo, o valor e o estado de cada solicitação.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label><label className={styles.filter}>Motivo<select value={reason} onChange={event => setReason(event.target.value)}><option value="">Todos</option>{reasons.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label></div>
      <SalesState list={list} empty="Nenhuma solicitação encontrada." noun="reembolsos" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de reembolsos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Solicitações de reembolso</caption><thead><tr><th scope="col">Solicitação</th><th scope="col">Cliente</th><th scope="col">Pagamento</th><th scope="col">Motivo</th><th scope="col">Status</th><th scope="col">Valor</th><th scope="col">Recebida</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">#{row.id}</th><td>#{row.userId}</td><td>#{row.paymentId}</td><td>{statusName(row.reason)}</td><td><span className={`${styles.badge} ${['NEGADA', 'FALHOU'].includes(row.status) ? styles.inactive : ''}`}>{statusName(row.status)}</span></td><td>{money(row.requestedAmount)}</td><td>{dateTime(row.receivedAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title={row.status === 'EM_ANALISE' ? 'Analisar reembolso' : 'Ver detalhes'} aria-label={`${row.status === 'EM_ANALISE' ? 'Analisar' : 'Ver'} reembolso ${row.id}`} onClick={() => open(row)}>{row.status === 'EM_ANALISE' ? <Scale size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <footer className={styles.footer}><span>Exibindo {list.items.length} solicitações{list.nextCursor ? ' · há mais' : ''}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? 'Carregando…' : 'Carregar mais'}</button></footer>
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>Reembolso #{selected?.id}</DialogTitle><DialogDescription className={styles.dialogDescription}>Confira a solicitação e o estado antes de registrar uma decisão.</DialogDescription>
      {detailLoading && <p role="status">Carregando solicitação…</p>}
      {detail && <><dl className={styles.detailGrid}><div><dt>Cliente</dt><dd>#{detail.userId}</dd></div><div><dt>Pagamento</dt><dd>#{detail.paymentId}</dd></div><div><dt>Pedido</dt><dd>{detail.orderId ? `#${detail.orderId}` : '—'}</dd></div><div><dt>Status</dt><dd>{statusName(detail.status)}</dd></div><div><dt>Motivo</dt><dd>{statusName(detail.reason)}</dd></div><div><dt>Valor solicitado</dt><dd>{money(detail.requestedAmount)}</dd></div><div><dt>Prazo de resposta</dt><dd>{dateTime(detail.responseDueAt)}</dd></div><div><dt>Compensação</dt><dd>{statusName(detail.compensation)}</dd></div></dl>{detail.details && <p className={styles.hint}>Detalhes: {detail.details}</p>}{detail.decisionBasis && <p className={styles.hint}>Justificativa registrada: {detail.decisionBasis}</p>}</>}
      {detail?.status === 'EM_ANALISE' && <form className={styles.form} onSubmit={decide}><label>Decisão<select value={decision} onChange={event => setDecision(event.target.value)}><option value="APPROVE">Aprovar</option><option value="DENY">Negar</option></select></label>{decision === 'APPROVE' && <label>Valor aprovado (R$)<input name="amount" inputMode="decimal" defaultValue={detail.requestedAmount ?? detail.paymentAmount} required /></label>}<label>Versão dos termos<input name="termsVersion" defaultValue={detail.termsVersion ?? ''} maxLength={50} required /></label><label className={styles.wide}>Justificativa<textarea name="basis" minLength={10} maxLength={1000} required /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Registrando…' : 'Registrar decisão'}</button></div></form>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
  </SalesLayout>;
}
