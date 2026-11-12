'use client';

import { PackagePlus } from 'lucide-react';
import { unitOperation, useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import UnitEquipmentRequest from './unit-equipment-request';
import UnitDeliveries from './unit-deliveries';
import UnitSupplyRequests from './unit-supply-requests';
import styles from './unit.module.css';

export default function UnitStockOperations({ localId, inputs, reloadStock, canManage=true, sessionId }) {
  const sources = useUnitList(localId ? `/sources?limit=100&localId=${localId}` : null, unitOperation);
  const requests = useUnitList(localId && (canManage || sessionId) ? `/requests?limit=20&localId=${localId}${sessionId?`&sessionId=${sessionId}`:''}` : null, unitOperation);
  const logistics = useUnitList(localId && (canManage || sessionId) ? `/logistics?limit=20&localId=${localId}${sessionId?`&sessionId=${sessionId}`:''}` : null, unitOperation);
  const movements = useUnitList(localId ? `/inventory/movements?limit=20&localId=${localId}` : null, unitOperation);
  const alerts = useUnitList(localId ? `/inventory/alerts?localId=${localId}&limit=20` : null, unitOperation);
  const canRecordMovement = Boolean(localId && (canManage || sessionId));
  const supplyAction = useUnitAction(requests.reload, unitOperation);
  const equipmentAction = useUnitAction(requests.reload, unitOperation);
  const movementAction = useUnitAction(() => { movements.reload(); alerts.reload(); reloadStock(); }, unitOperation);
  const deliveryAction = useUnitAction(() => { requests.reload(); logistics.reload(); movements.reload(); alerts.reload(); reloadStock(); }, unitOperation);

  async function requestSupply(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const inputId = String(form.get('inputId') ?? '');
    const quantity = Number(form.get('quantity'));
    const source = sources.items.find(row => row.id_insumo === inputId);
    if (!source || !Number.isInteger(quantity) || quantity < 1 || quantity > source.disponivel) return supplyAction.setError('Escolha um insumo e uma quantidade disponível na origem.');
    const note = String(form.get('note') ?? '').trim();
    if (await supplyAction.run('/requests', { method: 'POST', body: { localId, ...(sessionId?{sessionId}:{}), inputId, quantity, ...(note ? { note } : {}) } }, canManage ? 'Reposição de insumo solicitada ao fornecedor.' : 'Reposição de insumo enviada para avaliação do supervisor.')) formElement.reset();
  }

  async function move(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const inputId = String(form.get('inputId') ?? '');
    const quantity = Number(form.get('quantity'));
    const type = String(form.get('type'));
    const reason = String(form.get('reason') ?? '').trim();
    const input = inputs.find(row => row.id_insumo === inputId);
    if (!canRecordMovement || !input || !['SAIDA', 'PERDA'].includes(type) || !Number.isInteger(quantity) || quantity < 1 || quantity > input.disponivel || !reason) return movementAction.setError('Informe um produto ou insumo, a quantidade disponível e a justificativa.');
    const confirmation = type === 'SAIDA' ? 'Saída registrada. O saldo foi atualizado.' : 'Perda registrada. O saldo foi atualizado.';
    if (await movementAction.run('/inventory/movements', { method: 'POST', body: { inputId, tipo: type, quantidade: -quantity, motivo: reason } }, confirmation)) formElement.reset();
  }

  return <>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Solicitar reposição</h2><p>Selecione um insumo disponível em outro cinema.</p></div><PackagePlus size={19} aria-hidden="true" /></div><div className={styles.body}>
      <form className={styles.form} onSubmit={requestSupply}><label className={styles.full}>Insumo na origem<select name="inputId" required defaultValue=""><option value="">Selecione</option>{sources.items.map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome} · {row.nome_origem} · {row.disponivel} disponíveis</option>)}</select></label><label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" required /></label><label className={styles.full}>Observação<input name="note" maxLength={2000} placeholder="Opcional" /></label><button type="submit" className={styles.button} disabled={supplyAction.pending || !sources.items.length || (!canManage&&!sessionId)}>{supplyAction.pending ? 'Enviando…' : 'Solicitar'}</button></form>
      <UnitFeedback error={supplyAction.error} notice={supplyAction.notice} />
      <UnitListState list={sources} empty="Não há insumos de outro cinema disponíveis para reposição." /><UnitMore list={sources} />
    </div></section>
    <UnitEquipmentRequest key={`equipment:${localId ?? ''}:${sessionId ?? ''}`} localId={localId} canManage={canManage} sessionId={sessionId} action={equipmentAction} />
    {canRecordMovement && <section className={`${styles.panel} ${styles.ticket}`}><div className={styles.panelHeader}><div><h2>Registrar saída ou perda</h2><p>O saldo local e o histórico são atualizados juntos.</p></div></div><div className={styles.body}><form className={styles.form} onSubmit={move}><label>Produto ou insumo<select name="inputId" required defaultValue=""><option value="">Selecione</option>{inputs.filter(row => row.disponivel > 0).map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome} · {row.disponivel} disponíveis</option>)}</select></label><label>Tipo<select name="type" defaultValue="SAIDA"><option value="SAIDA">Saída</option><option value="PERDA">Perda</option></select></label><label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" required /></label><label className={styles.full}>Justificativa<input name="reason" required maxLength={255} /></label><button type="submit" className={styles.button} disabled={movementAction.pending || !inputs.some(row => row.disponivel > 0)}>{movementAction.pending ? 'Registrando…' : 'Registrar'}</button></form><UnitFeedback error={movementAction.error} notice={movementAction.notice} /></div></section>}
    <UnitSupplyRequests key={`requests:${localId ?? ''}:${sessionId ?? ''}`} list={requests} canManage={canManage} />
    <UnitDeliveries key={`deliveries:${localId ?? ''}:${sessionId ?? ''}`} list={logistics} action={deliveryAction} />
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Alertas de reposição</h2><p>Itens que atingiram a quantidade mínima.</p></div></div><div className={styles.body}><UnitListState list={alerts} empty="Nenhum alerta nesta unidade." />{alerts.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Disponível</th><th>Mínimo</th></tr></thead><tbody>{alerts.items.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.disponivel}</td><td>{row.quantidade_minima}</td></tr>)}</tbody></table></div>}<UnitMore list={alerts} /></div></section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Movimentações</h2><p>Histórico de entradas, saídas e perdas locais.</p></div></div><div className={styles.body}><UnitListState list={movements} empty="Nenhuma movimentação registrada." />{movements.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Registro</th><th>Item</th><th>Tipo</th><th>Qtd.</th><th>Data</th><th>Responsável</th><th>Justificativa</th></tr></thead><tbody>{movements.items.map(row => <tr key={row.id_movimentacao}><th scope="row">#{row.id_movimentacao}</th><td>{row.nome_item ?? `Insumo #${row.id_insumo}`}</td><td>{label(row.tipo)}</td><td>{row.quantidade}</td><td>{dateTime(row.data_movimentacao)}</td><td>#{row.id_usuario}</td><td>{row.motivo ?? '—'}</td></tr>)}</tbody></table></div>}<UnitMore list={movements} /></div></section>
  </>;
}
