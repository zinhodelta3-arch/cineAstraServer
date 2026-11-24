'use client';

import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { unitOperation, useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import UnitEquipmentRequest from './unit-equipment-request';
import UnitDeliveries from './unit-deliveries';
import UnitSupplyRequests from './unit-supply-requests';
import UnitStockMovement from './unit-stock-movement';
import styles from './unit.module.css';

export default function UnitStockOperations({ view, localId, inputs, equipment, reloadStock, canManage=true, sessionId, activeSession }) {
  const [requestFilter, setRequestFilter] = useState({ id:'', pending:false });
  const canRequest = Boolean(localId && (canManage || activeSession));
  const sources = useUnitList(view==='sources' && canRequest ? `/sources?limit=20&localId=${localId}` : null, unitOperation);
  const requestQuery = new URLSearchParams({ limit:'20', localId:localId ?? '' });
  if (sessionId) requestQuery.set('sessionId',sessionId);
  if (requestFilter.id) requestQuery.set('requestId',requestFilter.id);
  if (requestFilter.pending) requestQuery.set('supervision','PENDENTE');
  const requests = useUnitList(view==='requests' && localId && (canManage || sessionId) ? `/requests?${requestQuery}` : null, unitOperation);
  const logistics = useUnitList(view==='deliveries' && localId && (canManage || sessionId) ? `/logistics?limit=20&localId=${localId}${sessionId?`&sessionId=${sessionId}`:''}` : null, unitOperation);
  const movements = useUnitList(view==='movements' && localId ? `/inventory/movements?limit=20&localId=${localId}` : null, unitOperation);
  const alerts = useUnitList(view==='alerts' && localId ? `/inventory/alerts?localId=${localId}&limit=20` : null, unitOperation);
  const canRecordMovement = Boolean(localId && (canManage || activeSession));
  const supplyAction = useUnitAction(requests.reload, unitOperation);
  const equipmentAction = useUnitAction(requests.reload, unitOperation);
  const deliveryAction = useUnitAction(() => { requests.reload(); logistics.reload(); movements.reload(); alerts.reload(); reloadStock(); }, unitOperation);

  async function requestSupply(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const inputId = String(form.get('inputId') ?? '');
    const quantity = Number(form.get('quantity'));
    const source = sources.items.find(row => row.id_insumo === inputId);
    if (!canRequest || !source || !Number.isInteger(quantity) || quantity < 1 || quantity > source.disponivel) return supplyAction.setError('Escolha um insumo e uma quantidade disponível na origem.');
    const note = String(form.get('note') ?? '').trim();
    if (await supplyAction.run('/requests', { method: 'POST', body: { localId, ...(sessionId?{sessionId}:{}), inputId, quantity, ...(note ? { note } : {}) } }, canManage ? 'Reposição de insumo solicitada ao fornecedor.' : 'Reposição de insumo enviada para avaliação do supervisor.')) formElement.reset();
  }

  return <>
    {view==='sources' && <section className={styles.panel}><div className={styles.panelHeader}><div><h2>{canManage ? 'Solicitar reposição ao fornecedor' : 'Sugerir reposição'}</h2><p>Selecione um insumo disponível em outra unidade vinculada ao fornecedor.</p></div><PackagePlus size={19} aria-hidden="true" /></div><div className={styles.body}>
      {canRequest ? <><form className={styles.form} onSubmit={requestSupply}><label className={styles.full}>Insumo na origem<select name="inputId" required defaultValue=""><option value="">Selecione</option>{sources.items.map(row => <option key={row.id_insumo} value={row.id_insumo}>{[row.nome, row.fornecedor, row.nome_origem, `${row.disponivel} disponíveis`].filter(Boolean).join(' · ')}</option>)}</select></label><label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" required /></label><label className={styles.full}>Observação<input name="note" maxLength={2000} placeholder="Opcional" /></label><button type="submit" className={styles.button} disabled={supplyAction.pending || !sources.items.length}>{supplyAction.pending ? 'Enviando…' : canManage ? 'Solicitar' : 'Enviar sugestão'}</button></form>
      <UnitFeedback error={supplyAction.error} notice={supplyAction.notice} />
      <UnitListState list={sources} empty="Nenhum insumo disponível para reposição." />{sources.nextCursor && <button type="button" className={styles.secondary} onClick={sources.loadMore} disabled={sources.loadingMore}>Mais insumos</button>}</> : <p>Selecione uma sessão da equipe para sugerir a reposição.</p>}
    </div></section>}
    {view==='equipment' && <UnitEquipmentRequest key={`equipment:${localId ?? ''}:${sessionId ?? ''}`} localId={localId} canManage={canManage} sessionId={activeSession ? sessionId : null} action={equipmentAction} />}
    {view==='stock' && (canRecordMovement
      ? <UnitStockMovement key={localId} inputs={inputs} equipment={equipment} reloadStock={reloadStock} />
      : <p className={styles.empty}>O registro de movimentações requer vínculo com uma equipe ativa deste cinema.</p>)}
    {view==='requests' && <UnitSupplyRequests list={requests} canManage={canManage} requiresSession={!canManage&&!sessionId}
      filter={requestFilter} onFilter={setRequestFilter} />}
    {view==='deliveries' && <UnitDeliveries list={logistics} action={deliveryAction} requiresSession={!canManage&&!sessionId} />}
    {view==='alerts' && <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Alertas de reposição</h2><p>Itens que atingiram a quantidade mínima.</p></div></div><div className={styles.body}><UnitListState list={alerts} empty="Nenhum alerta nesta unidade." />{alerts.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Disponível</th><th>Mínimo</th></tr></thead><tbody>{alerts.items.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.disponivel}</td><td>{row.quantidade_minima}</td></tr>)}</tbody></table></div>}<UnitMore list={alerts} noun="alertas" /></div></section>}
    {view==='movements' && <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Movimentações</h2><p>Histórico de entradas, saídas e perdas locais.</p></div></div><div className={styles.body}><UnitListState list={movements} empty="Nenhuma movimentação registrada." />{movements.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Registro</th><th>Item</th><th>Tipo</th><th>Qtd.</th><th>Data</th><th>Responsável</th><th>Justificativa</th></tr></thead><tbody>{movements.items.map(row => <tr key={row.id_movimentacao}><th scope="row">#{row.id_movimentacao}</th><td>{row.nome_item ?? (row.id_equipamento ? `Equipamento #${row.id_equipamento}` : `Insumo #${row.id_insumo}`)}</td><td>{label(row.tipo)}</td><td>{row.quantidade}</td><td>{dateTime(row.data_movimentacao)}</td><td>#{row.id_usuario}</td><td>{row.motivo ?? '—'}</td></tr>)}</tbody></table></div>}<UnitMore list={movements} noun="movimentações" /></div></section>}
  </>;
}
