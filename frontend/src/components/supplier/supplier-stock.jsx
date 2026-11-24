'use client';
import { OperationFeedback } from '@/components/ui/list-feedback';

import { useState } from 'react';
import Link from 'next/link';
import { useTablePreference } from '@/hooks/use-table-preference';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { supplierRequest, useSupplierAction, useSupplierList, useSupplierLocations, useSupplierSearch } from '@/hooks/supplier/use-supplier-data';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import SupplierLayout, { dateTime, More, SupplierSearch, SupplierState, statusName } from './supplier-layout';
import SupplierStockTable from './supplier-stock-table';
import styles from '@/components/admin/catalog/catalog.module.css';

export default function SupplierStock({ ownInputs = false }) {
  const [localId, setLocalId] = useTablePreference('fornecedor:estoque:cinema','');
  const search = useSupplierSearch(ownInputs?'insumos-próprios':'estoque');
  const [dialog, setDialog] = useState(null);
  const [type, setType] = useState('ENTRADA');
  const locations = useSupplierLocations(!ownInputs);
  const localFilter = localId && !ownInputs ? `&localId=${localId}` : '';
  const inputs = useSupplierList(`inputs?limit=20&scope=${ownInputs ? 'own' : 'linked'}${localFilter}${search.parameter}`,ownInputs?'fornecedor:insumos-próprios':'fornecedor:estoque:insumos');
  const equipment = useSupplierList(ownInputs ? null : `equipment?limit=20&scope=linked${localFilter}${search.parameter}`,'fornecedor:estoque:equipamentos-vinculados');
  const ownEquipment = useSupplierList(ownInputs ? null : `equipment?limit=20&scope=own${search.parameter}`,'fornecedor:estoque:equipamentos-próprios');
  const movements = useSupplierList(ownInputs ? null : `inventory/movements?limit=20${localFilter}${search.parameter}`,'fornecedor:estoque:movimentos');
  const alerts = useSupplierList(localFilter ? `inventory/alerts?limit=20${localFilter}${search.parameter}` : null,'fornecedor:estoque:alertas');
  const item = dialog?.item;
  const balanceId = item?.[dialog.kind === 'inputs' ? 'id_insumo' : 'id_equipamento'];
  const detail = usePaginatedList(balanceId ? `inventory/${dialog.kind}/${balanceId}` : null, supplierRequest, { mode:'resource' });
  const { data:balance, error:balanceError } = detail;
  const action = useSupplierAction(() => {
    if (dialog?.kind === 'inputs') inputs.reload();
    else if (item?.id_local) equipment.reload();
    else ownEquipment.reload();
    movements.reload();
    if (localFilter) alerts.reload();
  });
  const committedEquipment = dialog?.kind === 'equipment' && (balance?.quantidade_reservada ?? 0) > 0;
  function open(kind, row, mode) { action.setError(''); setType('ENTRADA'); setDialog({ kind, item: row, mode }); }
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get('quantidade'));
    const reason = String(form.get('motivo') ?? '').trim();
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647 || ['AJUSTE', 'PERDA', 'DEVOLUCAO'].includes(type) && !reason) { action.setError('Informe uma quantidade válida e o motivo quando necessário.'); return; }
    const sign = ['SAIDA', 'PERDA'].includes(type) || type === 'AJUSTE' && form.get('direcao') === 'SAIDA' ? -1 : 1;
    if (!balance || committedEquipment) return action.setError('Confira o saldo disponível antes de movimentar o item.');
    if (sign < 0 && quantity > balance.disponivel) return action.setError('A quantidade supera o saldo disponível.');
    const body = { [dialog.kind === 'inputs' ? 'inputId' : 'equipmentId']: item[dialog.kind === 'inputs' ? 'id_insumo' : 'id_equipamento'], tipo: type, quantidade: sign * quantity, ...(reason ? { motivo: reason } : {}) };
    if (await action.run('inventory/movements', { method: 'POST', body }, 'Movimentação registrada.')) setDialog(null);
  }
  return <SupplierLayout title={ownInputs ? "Insumos próprios" : "Estoque"}
    description={ownInputs ? "Consulte os saldos dos insumos da empresa." : "Consulte o estoque da empresa e os itens vinculados a unidades."}
    action={<Link prefetch={false} className={styles.secondary} href={ownInputs ? "/fornecedor/estoque" : "/fornecedor/estoque?visao=insumos-proprios"}>
      {ownInputs ? "Voltar ao estoque" : "Insumos próprios"}</Link>}>
    <div className={`${styles.panel} mb-4`}><div className={styles.toolbar}><SupplierSearch {...search} placeholder="Nome do item ou categoria"/></div></div>
    <OperationFeedback pending={action.pending} success={action.notice} className="mb-4"/>
    {ownInputs ? <SupplierStockTable id="own-inputs" title="Insumos sem unidade" description="Itens mantidos no estoque do fornecedor." kind="inputs" list={inputs} open={open} /> : <>
      <SupplierStockTable id="own-equipment" title="Equipamentos próprios" description="Equipamentos da empresa sem vínculo com uma unidade." kind="equipment" list={ownEquipment} open={open} />
      <section className={`${styles.panel} ${styles.spacedPanel}`} aria-label="Filtro de unidade vinculada">
        <div className={styles.toolbar}>
          <label className={styles.filter}>Unidade vinculada<select value={localId} onChange={event => setLocalId(event.target.value)}>
            <option value="">Todas as unidades</option>{locations.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome_local ?? locations.name(row.id_local)}</option>)}</select></label>
          {locations.nextCursor && <button type="button" className={styles.secondary} disabled={locations.loadingMore} onClick={locations.loadMore}>Mais unidades</button>}
          {locations.error && <button type="button" className={styles.secondary} onClick={locations.reload}>Tentar carregar unidades novamente</button>}
        </div>
      </section>
      <SupplierStockTable id="linked-inputs" title="Insumos vinculados a unidades" description="Saldos dos insumos da empresa em cada unidade." kind="inputs" list={inputs} open={open} />
      <SupplierStockTable id="linked-equipment" title="Equipamentos vinculados a unidades" description="Unidade do cadastro e destino durante a entrega." kind="equipment" list={equipment} open={open} />
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Alertas de reposição</h2><p>Insumos com saldo disponível no mínimo.</p></div></header>{localId ? <><SupplierState list={alerts} noun="alertas" empty="Nenhum alerta para este cinema." />{alerts.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Disponível</th><th>Mínimo</th></tr></thead><tbody>{alerts.items.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.disponivel}</td><td>{row.quantidade_minima}</td></tr>)}</tbody></table></div>}<More list={alerts} noun="alertas" /></> : <p className={styles.state}>Selecione um cinema para consultar os alertas.</p>}</section>
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Movimentações</h2><p>Histórico dos seus itens.</p></div></header><SupplierState list={movements} noun="movimentações" empty="Nenhuma movimentação encontrada." />{movements.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Movimentações; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><thead><tr><th>Registro</th><th>Item</th><th>Tipo</th><th>Quantidade</th><th>Data</th><th>Motivo</th></tr></thead><tbody>{movements.items.map(row => <tr key={row.id_movimentacao}><th scope="row">#{row.id_movimentacao}</th><td>{row.nome_item ?? (row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`)}</td><td>{statusName(row.tipo)}</td><td>{row.id_solicitacao ? `#${row.id_solicitacao}` : '—'}</td><td>{row.id_logistica ? `#${row.id_logistica}` : '—'}</td><td>{row.quantidade > 0 ? '+' : ''}{row.quantidade}</td><td>{dateTime(row.data_movimentacao)}</td><td>{row.motivo || '—'}</td></tr>)}</tbody></table></div>}<More list={movements} noun="movimentações" /></section>
    </>}
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.mode === 'move' ? 'Movimentar' : 'Saldo'} · {item?.nome}</DialogTitle><DialogDescription className={styles.dialogDescription}>{item?.id_local ? item.nome_local ?? locations.name(item.id_local) : 'Estoque do fornecedor'}</DialogDescription>{balanceError && <p className={styles.error} role="alert">{balanceError}</p>}{!balance && !balanceError && <p role="status">Carregando saldo…</p>}{dialog && balance && <div className={`${styles.summaryGrid} ${styles.stockSummary}`}><div><span>{dialog.kind === 'inputs' ? 'Em mãos' : 'Quantidade cadastrada'}</span><strong>{balance.quantidade}</strong></div><div><span>Reservado</span><strong>{balance.quantidade_reservada ?? 0}</strong></div><div><span>Disponível</span><strong>{balance.disponivel ?? balance.quantidade}</strong></div></div>}
      {committedEquipment && <p className={styles.state}>Equipamento reservado para transferência. A quantidade fica disponível para ajuste após a devolução ou o cancelamento.</p>}
      {dialog?.mode === 'move' && <form className={styles.form} onSubmit={save}><label>Tipo<select value={type} onChange={event => setType(event.target.value)}><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="AJUSTE">Ajuste</option><option value="PERDA">Perda</option><option value="DEVOLUCAO">Devolução</option></select></label><label>Quantidade<input name="quantidade" type="number" min="1" max="2147483647" required /></label>{type === 'AJUSTE' && <label>Direção<select name="direcao"><option value="ENTRADA">Aumentar</option><option value="SAIDA">Reduzir</option></select></label>}<label className={styles.wide}>Motivo<input name="motivo" maxLength={255} required={['AJUSTE', 'PERDA', 'DEVOLUCAO'].includes(type)} /></label>{action.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{action.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Cancelar</button><button type="submit" className={styles.primary} disabled={action.pending || !balance || committedEquipment}>{action.pending ? 'Registrando…' : 'Registrar'}</button></div></form>}
      {dialog?.mode === 'balance' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Fechar</button><button type="button" className={styles.primary} disabled={!balance || committedEquipment} onClick={() => open(dialog.kind, item, 'move')}>Movimentar</button></div>}
    </DialogContent></Dialog>
  </SupplierLayout>;
}
