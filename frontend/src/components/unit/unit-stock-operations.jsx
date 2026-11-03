'use client';

import { ArrowDownToLine, PackagePlus } from 'lucide-react';
import { unitOperation, useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import styles from './unit.module.css';

export default function UnitStockOperations({ localId, inputs, reloadStock }) {
  const sources = useUnitList(localId ? '/sources?limit=100' : null, unitOperation);
  const requests = useUnitList(localId ? '/requests?limit=20' : null, unitOperation);
  const logistics = useUnitList(localId ? '/logistics?limit=20' : null, unitOperation);
  const movements = useUnitList(localId ? '/inventory/movements?limit=20' : null, unitOperation);
  const alerts = useUnitList(localId ? `/inventory/alerts?localId=${localId}&limit=20` : null, unitOperation);
  const action = useUnitAction(() => { requests.reload(); logistics.reload(); movements.reload(); alerts.reload(); reloadStock(); }, unitOperation);

  async function requestSupply(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const inputId = String(form.get('inputId') ?? '');
    const quantity = Number(form.get('quantity'));
    const source = sources.items.find(row => row.id_insumo === inputId);
    if (!source || !Number.isInteger(quantity) || quantity < 1 || quantity > source.disponivel) return action.setError('Escolha um insumo e uma quantidade disponível na origem.');
    const note = String(form.get('note') ?? '').trim();
    if (await action.run('/requests', { method: 'POST', body: { localId, inputId, quantity, ...(note ? { note } : {}) } }, 'Solicitação enviada ao fornecedor.')) formElement.reset();
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
    if (!input || !['SAIDA', 'PERDA'].includes(type) || !Number.isInteger(quantity) || quantity < 1 || quantity > input.disponivel || !reason) return action.setError('Informe um insumo, uma quantidade disponível e o motivo.');
    if (await action.run('/inventory/movements', { method: 'POST', body: { inputId, tipo: type, quantidade: -quantity, motivo: reason } }, 'Movimentação registrada.')) formElement.reset();
  }

  return <>
    <UnitFeedback error={action.error} notice={action.notice} />
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Solicitar reposição</h2><p>Selecione um insumo disponível em outro cinema.</p></div><PackagePlus size={19} aria-hidden="true" /></div><div className={styles.body}>
      <form className={styles.form} onSubmit={requestSupply}><label className={styles.full}>Insumo na origem<select name="inputId" required defaultValue=""><option value="">Selecione</option>{sources.items.map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome} · {row.nome_origem} · {row.disponivel} disponíveis</option>)}</select></label><label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" required /></label><label className={styles.full}>Observação<input name="note" maxLength={2000} placeholder="Opcional" /></label><button type="submit" className={styles.button} disabled={action.pending || !sources.items.length}>Solicitar</button></form>
      <UnitListState list={sources} empty="Não há insumos de outro cinema disponíveis para reposição." /><UnitMore list={sources} />
    </div></section>
    <section className={`${styles.panel} ${styles.ticket}`}><div className={styles.panelHeader}><div><h2>Registrar saída ou perda</h2><p>O saldo local e o histórico são atualizados juntos.</p></div></div><div className={styles.body}><form className={styles.form} onSubmit={move}><label>Insumo<select name="inputId" required defaultValue=""><option value="">Selecione</option>{inputs.filter(row => row.disponivel > 0).map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome} · {row.disponivel} disponíveis</option>)}</select></label><label>Tipo<select name="type" defaultValue="SAIDA"><option value="SAIDA">Saída</option><option value="PERDA">Perda</option></select></label><label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" required /></label><label className={styles.full}>Motivo<input name="reason" required maxLength={255} /></label><button type="submit" className={styles.button} disabled={action.pending || !inputs.some(row => row.disponivel > 0)}>Registrar</button></form></div></section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Solicitações</h2><p>Acompanhe os pedidos de reposição desta unidade.</p></div></div><div className={styles.body}><UnitListState list={requests} empty="Nenhuma solicitação cadastrada." />{requests.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Pedido</th><th>Insumo</th><th>Qtd.</th><th>Data</th><th>Estado</th></tr></thead><tbody>{requests.items.map(row => <tr key={row.id_solicitacao}><th scope="row">#{row.id_solicitacao}</th><td>{sources.items.find(source => source.id_insumo === row.id_insumo)?.nome ?? `Insumo #${row.id_insumo}`}</td><td>{row.quantidade}</td><td>{dateTime(row.data_solicitacao)}</td><td><span className={styles.badge}>{label(row.status)}</span></td></tr>)}</tbody></table></div>}<UnitMore list={requests} /></div></section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Entregas</h2><p>Confirme o recebimento após o envio pelo fornecedor.</p></div></div><div className={styles.body}><UnitListState list={logistics} empty="Nenhuma entrega cadastrada." />{logistics.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Entrega</th><th>Solicitação</th><th>Qtd.</th><th>Estado</th><th>Ação</th></tr></thead><tbody>{logistics.items.map(row => <tr key={row.id_logistica}><th scope="row">#{row.id_logistica}</th><td>#{row.id_solicitacao}</td><td>{row.quantidade}</td><td><span className={styles.badge}>{label(row.status)}</span></td><td>{['ENVIADO', 'EM_TRANSITO'].includes(row.status) && <button type="button" className={styles.iconButton} title="Confirmar recebimento" aria-label={`Confirmar recebimento da entrega ${row.id_logistica}`} disabled={action.pending} onClick={() => action.run(`/logistics/${row.id_logistica}/receive`, { method: 'POST' }, 'Recebimento confirmado.')}><ArrowDownToLine size={16} /></button>}</td></tr>)}</tbody></table></div>}<UnitMore list={logistics} /></div></section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Alertas de reposição</h2><p>Itens que atingiram a quantidade mínima.</p></div></div><div className={styles.body}><UnitListState list={alerts} empty="Nenhum alerta nesta unidade." />{alerts.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Disponível</th><th>Mínimo</th></tr></thead><tbody>{alerts.items.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.disponivel}</td><td>{row.quantidade_minima}</td></tr>)}</tbody></table></div>}<UnitMore list={alerts} /></div></section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Movimentações</h2><p>Histórico de entradas, saídas e perdas locais.</p></div></div><div className={styles.body}><UnitListState list={movements} empty="Nenhuma movimentação registrada." />{movements.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Registro</th><th>Item</th><th>Tipo</th><th>Qtd.</th><th>Data</th><th>Motivo</th></tr></thead><tbody>{movements.items.map(row => <tr key={row.id_movimentacao}><th scope="row">#{row.id_movimentacao}</th><td>{row.nome_item ?? `Insumo #${row.id_insumo}`}</td><td>{label(row.tipo)}</td><td>{row.quantidade}</td><td>{dateTime(row.data_movimentacao)}</td><td>{row.motivo ?? '—'}</td></tr>)}</tbody></table></div>}<UnitMore list={movements} /></div></section>
  </>;
}
