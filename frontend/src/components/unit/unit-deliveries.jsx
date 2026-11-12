'use client';

import { useState } from 'react';
import { ArrowDownToLine, History, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import ShipmentHistory from '@/components/logistics/shipment-history';
import { unitOperation } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import styles from './unit.module.css';

export default function UnitDeliveries({ list, action }) {
  const [returning, setReturning] = useState(null);
  const [tracking, setTracking] = useState(null);

  function close() {
    if (action.pending) return;
    action.setError('');
    setReturning(null);
  }

  async function confirmReturn() {
    const saved = await action.run(`/logistics/${returning.id_logistica}/return`,
      { method: 'POST' }, 'Devolução registrada. O equipamento voltou ao estoque de origem.');
    if (saved) setReturning(null);
  }

  return <section className={styles.panel} aria-labelledby="unit-deliveries-title">
    <header className={styles.panelHeader}><div>
      <h2 id="unit-deliveries-title">Entregas</h2>
      <p>Confirme recebimentos e registre a devolução de equipamentos após o encerramento da sessão.</p>
    </div></header>
    <div className={styles.body}>
      <UnitFeedback error={!returning && action.error} notice={action.notice} />
      <UnitListState list={list} empty="Nenhuma entrega cadastrada." />
      {list.items.length > 0 && <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr>
            <th scope="col">Entrega</th><th scope="col">Solicitação</th><th scope="col">Qtd.</th>
            <th scope="col">Estado</th><th scope="col">Insumo creditado</th><th scope="col">Devolução</th><th scope="col">Ações</th>
          </tr></thead>
          <tbody>{list.items.map(row => <tr key={row.id_logistica}>
            <th scope="row">#{row.id_logistica}</th>
            <td>{row.id_solicitacao ? `#${row.id_solicitacao}` : '—'}</td><td>{row.quantidade}</td>
            <td><span className={styles.badge}>{label(row.status)}</span></td>
            <td>{row.status === 'RECEBIDO' && row.id_insumo_origem ? `#${row.id_insumo_destino ?? row.id_insumo_origem}` : '—'}</td>
            <td>{dateTime(row.data_devolucao)}</td>
            <td>
              <button type="button" className={styles.iconButton} title="Histórico da entrega"
                aria-label={`Histórico da entrega ${row.id_logistica}`} onClick={() => setTracking(row)}><History size={16} aria-hidden="true" /></button>
              {['ENVIADO', 'EM_TRANSITO'].includes(row.status) && <button type="button"
                className={styles.iconButton} title="Confirmar recebimento"
                aria-label={`Confirmar recebimento da entrega ${row.id_logistica}`} disabled={action.pending}
                onClick={() => action.run(`/logistics/${row.id_logistica}/receive`, { method: 'POST' }, 'Recebimento confirmado.')}>
                <ArrowDownToLine size={16} aria-hidden="true" />
              </button>}
              {row.devolucao_disponivel && <button type="button" className={styles.iconButton}
                title="Registrar devolução" aria-label={`Registrar devolução da entrega ${row.id_logistica}`}
                disabled={action.pending} onClick={() => { action.setError(''); setReturning(row); }}>
                <RotateCcw size={16} aria-hidden="true" />
              </button>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
      <UnitMore list={list} />
    </div>
    <Dialog open={Boolean(tracking)} onOpenChange={open => { if (!open) setTracking(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>Histórico da entrega #{tracking?.id_logistica}</DialogTitle>
        <DialogDescription>{tracking?.nome_transporte ?? 'Sem transporte vinculado'}. {tracking?.data_prevista ? `Chegada estimada pela rota em ${dateTime(tracking.data_prevista)}.` : 'Sem estimativa de chegada.'}</DialogDescription>
        {tracking && <ShipmentHistory path={`/logistics/${tracking.id_logistica}/history?limit=10`} request={unitOperation} />}
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(returning)} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>Devolução da entrega #{returning?.id_logistica}</DialogTitle>
        <DialogDescription>Confirme após o equipamento voltar ao estoque de origem. O sistema registrará a devolução e atualizará o estoque.</DialogDescription>
        <UnitFeedback error={action.error} />
        <div className={styles.row}>
          <button type="button" className={styles.secondary} onClick={close} disabled={action.pending}>Voltar</button>
          <button type="button" className={styles.button} onClick={confirmReturn} disabled={action.pending}>
            {action.pending ? 'Registrando…' : 'Confirmar devolução'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </section>;
}
