'use client';

import MoneyInput from "@/components/ui/money-input";

import TablePagination from '@/components/ui/table-pagination';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Eye, Scale } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { salesRequest, useAdminSales } from '@/hooks/admin/use-admin-sales';
import SalesLayout, { SalesState, dateTime, money, statusName } from './sales-layout';
import SalesActionsDialog from './sales-actions-dialog';
import styles from '../catalog/catalog.module.css';

const stages = {
  pending: { title: 'Pendentes', statuses: ['EM_ANALISE','RECEBIDA','ENVIADA'], empty: 'Nenhuma solicitação pendente.' },
  closed: { title: 'Encerradas', statuses: ['CONFIRMADA','NEGADA','FALHOU','CANCELADA'], empty: 'Nenhuma solicitação encerrada.' },
};
const refundStatus = { EM_ANALISE:'Em análise', RECEBIDA:'Aprovada', ENVIADA:'Aguardando devolução', CONFIRMADA:'Devolução confirmada', NEGADA:'Negada', FALHOU:'Devolução não concluída', CANCELADA:'Cancelada' };
const reasons = ['ARREPENDIMENTO', 'DEFEITO', 'OUTRO', 'CANCELAMENTO_PLANO'];

export default function RefundsAdmin() {
  const [stage, setStage] = useState('pending');
  const [visibility, setVisibility] = useState('active');
  const [archiving, setArchiving] = useState(null);
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [decision, setDecision] = useState('APPROVE');
  const [amount,setAmount]=useState('');
  const lock = useRef(false);
  const params = new URLSearchParams({ limit: '20', stage, visibility:stage==='pending'?'active':visibility });
  if (status) params.set('status', status);
  if (reason) params.set('reason', reason);
  const list = useAdminSales(`refunds?${params}`);

  useEffect(() => {
    if (!selected) return;
    const request = new AbortController();
    salesRequest(`refunds/${selected.id}`,{signal:request.signal}).then(value => {
      if (!request.signal.aborted) { setDetail(value); setAmount(value.remainingAmount??''); }
    })
      .catch(cause => { if (!request.signal.aborted) setError(cause.message); })
      .finally(() => { if (!request.signal.aborted) setDetailLoading(false); });
    return () => request.abort();
  }, [selected]);

  function open(row) {
    setNotice(''); setError(''); setDetail(null); setDetailLoading(true); setDecision('APPROVE'); setSelected(row);
  }
  function close() { if (!lock.current) setSelected(null); }
  const partial=Boolean(detail?.orderId)&&decision==='APPROVE'&&Boolean(amount)&&Number(amount)<Number(detail.remainingAmount);
  async function reconcile(){
    if(lock.current||!detail)return;
    lock.current=true;setPending(true);setError('');
    try{
      await salesRequest(`refunds/${detail.id}/reconcile`,{method:'POST',body:{}});
      setDetail(await salesRequest(`refunds/${detail.id}`));
      list.reload();
    }catch(cause){setError(cause.message);}
    finally{lock.current=false;setPending(false);}
  }
  async function decide(event) {
    event.preventDefault();
    if (!detail || detail.status !== 'EM_ANALISE' || lock.current) return;
    const form = new FormData(event.currentTarget);
    const amount = String(form.get('amount') ?? '').trim().replace(',', '.');
    const termsVersion = String(form.get('termsVersion') ?? '').trim();
    const basis = String(form.get('basis') ?? '').trim();
    const response = String(form.get('response') ?? '').trim();
    const itemIds=form.getAll('refundItem');
    if (basis.length < 10 || basis.length > 1000 || !termsVersion || termsVersion.length > 50) { setError('Informe a versão dos termos e uma justificativa de 10 a 1000 caracteres.'); return; }
    if (response.length < 10 || response.length > 1000) { setError('Escreva uma resposta ao cliente de 10 a 1000 caracteres.'); return; }
    if (decision === 'APPROVE' && (!/^(0|[1-9]\d{0,7})\.\d{2}$/.test(amount) || amount === '0.00')) { setError('Informe o valor aprovado com duas casas decimais.'); return; }
    if(partial&&!itemIds.length){setError('Selecione os itens incluídos no reembolso parcial.');return;}
    lock.current = true; setPending(true); setError('');
    try {
      const result = await salesRequest(`refunds/${detail.id}/decision`, { method: 'POST', body: { decision, ...(decision === 'APPROVE' ? { amount } : {}), ...(partial&&{itemIds}), termsVersion, basis, response } });
      setSelected(null);
      setNotice(result.status==='RECEBIDA'?'Solicitação aprovada. A devolução pode ser acompanhada em Pendentes.':`Solicitação ${result.status==='NEGADA'?'negada':'cancelada'}. A resposta está disponível ao cliente.`);
      list.reload();
    } catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  return <SalesLayout title="Reembolsos" description="Analise solicitações e acompanhe a devolução pelo meio de pagamento original.">
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="refund-list-title">
      <header className={styles.panelHeader}><h2 id="refund-list-title">Solicitações {stages[stage].title.toLowerCase()}</h2>
        <Link className={styles.secondary} href="/admin/vendas">Iniciar pelo pedido</Link>
      </header>
      <div className={styles.toolbar}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Área de reembolsos">
          {Object.entries(stages).map(([value,{title}])=><button key={value} type="button" aria-pressed={stage===value}
            className={stage===value?styles.primary:styles.secondary} onClick={()=>{setStage(value);setStatus('');setNotice('');}}>{title}</button>)}
        </div>
        <label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">Todos</option>{stages[stage].statuses.map(value => <option key={value} value={value}>{refundStatus[value]}</option>)}
        </select></label>
        <label className={styles.filter}>Motivo<select value={reason} onChange={event => setReason(event.target.value)}>
          <option value="">Todos</option>{reasons.map(value => <option key={value} value={value}>{statusName(value)}</option>)}
        </select></label>
        {stage==='closed'&&<label className={styles.filter}>Exibição<select value={visibility} onChange={event=>setVisibility(event.target.value)}>
          <option value="active">Encerradas</option><option value="archived">Arquivadas</option>
        </select></label>}
      </div>
      <SalesState list={list} empty={status||reason?'Nenhum resultado para os filtros selecionados.':stages[stage].empty} noun="reembolsos" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de reembolsos" tabIndex={0}><table className={styles.table}><caption className="sr-only">Solicitações de reembolso</caption><thead><tr><th scope="col">Solicitação</th><th scope="col">Cliente</th><th scope="col">Pagamento</th><th scope="col">Motivo</th><th scope="col">Status</th><th scope="col">Valor</th><th scope="col">Recebida</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">#{row.id}</th><td>#{row.userId}</td><td>#{row.paymentId}</td><td>{statusName(row.reason)}</td><td><span className={`${styles.badge} ${['NEGADA', 'FALHOU'].includes(row.status) ? styles.inactive : ''}`}>{refundStatus[row.status]}</span></td><td>{money(row.requestedAmount)}</td><td>{dateTime(row.receivedAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title={row.status === 'EM_ANALISE' ? 'Analisar reembolso' : 'Ver detalhes'} aria-label={`${row.status === 'EM_ANALISE' ? 'Analisar' : 'Ver'} reembolso ${row.id}`} onClick={() => open(row)}>{row.status === 'EM_ANALISE' ? <Scale size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      {list.items.length>0&&<TablePagination list={list} />}
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>Reembolso #{selected?.id}</DialogTitle><DialogDescription className={styles.dialogDescription}>Confira a solicitação e o estado antes de registrar uma decisão.</DialogDescription>
      {detailLoading && <p role="status">Carregando solicitação…</p>}
      {detail && <>
        <dl className={styles.detailGrid}>
          <div><dt>Cliente</dt><dd>#{detail.userId}</dd></div>
          <div><dt>Pagamento</dt><dd>#{detail.paymentId}</dd></div>
          <div><dt>Pedido</dt><dd>{detail.orderId ? `#${detail.orderId}` : '—'}</dd></div>
          <div><dt>Status</dt><dd>{refundStatus[detail.status]}</dd></div>
          <div><dt>Motivo</dt><dd>{statusName(detail.reason)}</dd></div>
          <div><dt>Valor aprovado</dt><dd>{money(detail.requestedAmount)}</dd></div>
          <div><dt>Valor devolvido</dt><dd>{money(detail.confirmedAmount)}</dd></div>
          <div><dt>Prazo de resposta</dt><dd>{dateTime(detail.responseDueAt)}</dd></div>
          <div><dt>Compensação</dt><dd>{statusName(detail.compensation)}</dd></div>
          {detail.archivedAt&&<div><dt>Arquivada em</dt><dd>{dateTime(detail.archivedAt)}</dd></div>}
        </dl>
        {detail.details && <p className={`${styles.hint} whitespace-pre-wrap break-words`}><strong>Detalhes da solicitação</strong><br />{detail.details}</p>}
        {detail.decisionBasis && <p className={`${styles.hint} whitespace-pre-wrap break-words`}><strong>Justificativa interna</strong><br />{detail.decisionBasis}</p>}
        {detail.response && <p className={`${styles.hint} whitespace-pre-wrap break-words`}><strong>Resposta ao cliente</strong><br />{detail.response}</p>}
      </>}
      {detail?.selectedItems?.length>0&&<ul>{detail.selectedItems.map(item=><li key={item.itemId}>Item #{item.itemId} · {money(item.amount)}</li>)}</ul>}
      {detail?.status === 'EM_ANALISE' && <form className={styles.form} onSubmit={decide} aria-busy={pending}>
        <label>Decisão<select value={decision} disabled={pending} onChange={event => setDecision(event.target.value)}>
          <option value="APPROVE">Aprovar</option><option value="DENY">Negar</option><option value="CANCEL">Cancelar solicitação</option>
        </select></label>
        {decision === 'APPROVE' && <label>Valor aprovado (R$)<MoneyInput name="amount" defaultValue={amount} onAmountChange={setAmount} disabled={pending} required /></label>}
        {partial && <fieldset className={styles.wide} disabled={pending}>
          <legend>Itens reembolsados</legend>
          {detail.eligibleItems.map(item=><label key={item.id} className="flex items-center gap-2">
            <input name="refundItem" type="checkbox" value={item.id} />{item.name} · {item.quantity} un. · saldo {money(item.remainingAmount)}
          </label>)}
        </fieldset>}
        <label>Versão dos termos<input name="termsVersion" defaultValue={detail.termsVersion ?? ''} readOnly={pending} maxLength={50} required /></label>
        <label className={styles.wide}>Justificativa interna<textarea name="basis" minLength={10} maxLength={1000} readOnly={pending} required /></label>
        <label className={styles.wide}>Resposta ao cliente<textarea name="response" minLength={10} maxLength={1000} readOnly={pending} required /></label>
        <div className={`${styles.dialogActions} ${styles.wide}`}>
          <button type="button" className={styles.secondary} disabled={pending} onClick={close}>Voltar</button>
          <button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Registrando…' : 'Registrar decisão'}</button>
        </div>
      </form>}
      {['RECEBIDA','ENVIADA'].includes(detail?.status)&&<button type="button" className={styles.secondary} disabled={pending} onClick={reconcile}>{pending?'Consultando…':'Consultar provedor'}</button>}
      {detail&&!detail.archivedAt&&stages.closed.statuses.includes(detail.status)&&<button type="button" className={styles.secondary}
        onClick={()=>{close();setArchiving(detail);}}>Arquivar solicitação</button>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
    {archiving&&<SalesActionsDialog resource="refunds" mode="archive" row={archiving} onClose={()=>setArchiving(null)}
      onSaved={message=>{setArchiving(null);setNotice(message);list.reload();}} />}
  </SalesLayout>;
}
