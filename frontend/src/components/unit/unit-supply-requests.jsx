'use client';

import { useState } from 'react';
import { ClipboardCheck, History, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import ShipmentHistory from '@/components/logistics/shipment-history';
import styles from './unit.module.css';

const stockLabels = { SALDO_INSUFICIENTE: 'Saldo insuficiente na origem', INDISPONIVEL: 'Item indisponível na origem' };
const deliveryLabels = { PENDENTE:'Aprovada · aguardando envio', ENVIADO:'Enviada', EM_TRANSITO:'Em trânsito',
  RECEBIDO:'Recebida', CANCELADO:'Entrega cancelada', DEVOLVIDO:'Equipamento devolvido' };
const requestItem = row => row.nome_item ?? (row.id_equipamento ? `Equipamento #${row.id_equipamento}` : `Insumo #${row.id_insumo}`);
function requestStatus(row) {
  if (row.status === 'CANCELADA') return 'Cancelada';
  if (row.status_supervisao === 'PENDENTE') return 'Pendente de supervisão';
  if (row.status_supervisao === 'RECUSADA') return 'Rejeitada pela supervisão';
  if (row.entrega) return deliveryLabels[row.entrega.status] ?? label(row.entrega.status);
  if (row.status === 'PENDENTE') return 'Aguardando o fornecedor';
  return label(row.status);
}

export default function UnitSupplyRequests({ list, canManage, requiresSession, filter, onFilter }) {
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState(null);
  const [tracking, setTracking] = useState(null);
  const decision = useUnitAction(list.reload, unitOperation);
  const alternatives = useUnitList(selected ? `/requests/${selected.id_solicitacao}/alternatives` : null, unitOperation);

  async function decide(value) {
    const success = value === 'APROVADA' ? 'Solicitação aprovada e encaminhada ao fornecedor.' : 'Solicitação rejeitada.';
    if (await decision.run(`/requests/${review.id_solicitacao}/review`, { method: 'POST', body: { decision: value } }, success)) setReview(null);
  }

  function search(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onFilter({ id:String(data.get('requestId') ?? '').trim(), pending:data.has('pending') });
  }

  return <section className={styles.panel} aria-labelledby="unit-stock-requests">
    <header className={styles.panelHeader}><div>
      <h2 id="unit-stock-requests">Solicitações</h2>
      <p>Acompanhe cada pedido da solicitação ao recebimento.</p>
    </div><button type="button" className={styles.secondary} disabled={list.loading || requiresSession} onClick={list.reload}>Atualizar</button></header>
    <div className={styles.body}>
      {!requiresSession && <form className={styles.toolbar} onSubmit={search}>
        <label className={styles.field}>Número da solicitação<input name="requestId" type="number" min="1" max="4294967295"
          defaultValue={filter.id} /></label>
        {canManage && <label className={styles.row}><input type="checkbox" name="pending" defaultChecked={filter.pending} />Pendentes de supervisão</label>}
        <button type="submit" className={styles.secondary}>Filtrar</button>
      </form>}
      <UnitFeedback notice={decision.notice} />
      <UnitListState list={list} empty={requiresSession ? 'Selecione uma sessão da equipe para consultar as solicitações.' : 'Nenhuma solicitação cadastrada.'} />
      {list.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th scope="col">Pedido</th><th scope="col">Item</th><th scope="col">Qtd.</th>
          <th scope="col">Data</th><th scope="col">Estado</th><th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(row => <tr key={row.id_solicitacao}>
          <th scope="row">#{row.id_solicitacao}</th>
          <td>{requestItem(row)}{row.fornecedor && <small>{row.fornecedor}</small>}</td>
          <td>{row.quantidade}</td><td>{dateTime(row.data_solicitacao)}</td>
          <td><span className={styles.badge}>{requestStatus(row)}</span>
            {row.data_decisao_supervisao && <p className={styles.muted}>{label(row.status_supervisao)} · {dateTime(row.data_decisao_supervisao)}{row.id_supervisor_decisao && ` · Supervisor #${row.id_supervisor_decisao}`}</p>}
            {stockLabels[row.estoque_origem] && <p>{stockLabels[row.estoque_origem]}</p>}
          </td>
          <td><div className={styles.actionRow}>{canManage && row.status_supervisao === 'PENDENTE' &&
            <button type="button" className={styles.iconButton} title="Revisar solicitação"
              aria-label={`Revisar solicitação ${row.id_solicitacao}`}
              onClick={() => { decision.setError(''); setReview(row); }}><ClipboardCheck size={16} aria-hidden="true" /></button>}
            {(row.status === 'RECUSADA' || stockLabels[row.estoque_origem]) &&
            <button type="button" className={styles.iconButton} title="Consultar alternativas"
              aria-label={`Consultar alternativas para a solicitação ${row.id_solicitacao}`}
              onClick={() => setSelected(row)}><Search size={16} aria-hidden="true" /></button>}
            {row.entrega && <button type="button" className={styles.iconButton} title="Acompanhar entrega"
              aria-label={`Acompanhar entrega da solicitação ${row.id_solicitacao}`}
              onClick={() => setTracking(row)}><History size={16} aria-hidden="true" /></button>}
          </div></td>
        </tr>)}</tbody>
      </table></div>}
      <UnitMore list={list} />
    </div>
    <Dialog open={Boolean(tracking)} onOpenChange={open => { if (!open) setTracking(null); }}>
      <DialogContent className={`${styles.dialog} ${styles.trackingDialog}`}>
        <DialogTitle>Entrega #{tracking?.entrega.id_logistica}</DialogTitle>
        <DialogDescription>{tracking && `${requestItem(tracking)} · ${requestStatus(tracking)}`}</DialogDescription>
        {tracking && <>
          <ul className={styles.list}>
            <li><span>Solicitada</span><strong>{dateTime(tracking.data_solicitacao)}</strong></li>
            {tracking.entrega.envio && <li><span>Enviada</span><strong>{dateTime(tracking.entrega.envio)}</strong></li>}
            {tracking.entrega.recebimento && <li><span>Recebida</span><strong>{dateTime(tracking.entrega.recebimento)}</strong></li>}
          </ul>
          <ShipmentHistory path={`/logistics/${tracking.entrega.id_logistica}/history?limit=10`} request={unitOperation} />
        </>}
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(review)} onOpenChange={open => { if (!open && !decision.pending) setReview(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>Revisar solicitação #{review?.id_solicitacao}</DialogTitle>
        <DialogDescription>A aprovação disponibiliza a solicitação para o fornecedor avaliar e preparar o envio.</DialogDescription>
        {review && <dl className={styles.list}>
          <div><dt>Item</dt><dd>{requestItem(review)}</dd></div>
          <div><dt>Quantidade</dt><dd>{review.quantidade}</dd></div>
          <div><dt>Solicitante</dt><dd>Colaborador #{review.id_usuario}</dd></div>
          <div><dt>Data do pedido</dt><dd>{dateTime(review.data_solicitacao)}</dd></div>
          {review.observacao && <div><dt>Observação</dt><dd>{review.observacao}</dd></div>}
          {stockLabels[review.estoque_origem] && <div><dt>Estoque</dt><dd>{stockLabels[review.estoque_origem]}</dd></div>}
        </dl>}
        <UnitFeedback error={decision.error} />
        <div className={styles.row}>
          <button type="button" className={styles.secondary} disabled={decision.pending} onClick={() => decide('RECUSADA')}>Rejeitar</button>
          <button type="button" className={styles.button} disabled={decision.pending} onClick={() => decide('APROVADA')}>Aprovar e encaminhar</button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>Alternativas para a solicitação #{selected?.id_solicitacao}</DialogTitle>
        <DialogDescription>Confira a compatibilidade do item antes de fazer um novo pedido. A lista considera materiais com o mesmo nome e categoria que atendem à quantidade solicitada.</DialogDescription>
        <UnitListState list={alternatives} empty="Nenhum fornecedor alternativo disponível para esta solicitação." />
        {alternatives.items.length > 0 && <ul className={styles.list}>
          {alternatives.items.map(item => <li key={item.item_id}>
            <div><strong>{item.nome}</strong><small>{item.fornecedor} · {item.nome_origem}</small></div>
          </li>)}
        </ul>}
      </DialogContent>
    </Dialog>
  </section>;
}
