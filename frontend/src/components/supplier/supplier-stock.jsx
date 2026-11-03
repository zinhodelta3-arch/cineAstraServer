'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Gauge } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { supplierRequest, useSupplierAction, useSupplierList, useSupplierLocations } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { dateTime, More, SupplierState, statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';

export default function SupplierStock() {
  const [localId, setLocalId] = useState('');
  const [dialog, setDialog] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState('');
  const [type, setType] = useState('ENTRADA');
  const locations = useSupplierLocations();
  const inputs = useSupplierList(`inputs?limit=20${localId ? `&localId=${localId}` : ''}`);
  const equipment = useSupplierList(`equipment?limit=20${localId ? `&localId=${localId}` : ''}`);
  const movements = useSupplierList(`inventory/movements?limit=20${localId ? `&localId=${localId}` : ''}`);
  const alerts = useSupplierList(localId ? `inventory/alerts?limit=20&localId=${localId}` : null);
  const action = useSupplierAction(() => { inputs.reload(); equipment.reload(); movements.reload(); if (localId) alerts.reload(); });
  const item = dialog?.item;
  useEffect(() => {
    if (!dialog || !item) return;
    const abort = new AbortController();
    setBalance(null); setBalanceError('');
    supplierRequest(`inventory/${dialog.kind}/${item[dialog.kind === 'inputs' ? 'id_insumo' : 'id_equipamento']}`, { signal: abort.signal })
      .then(value => { if (!abort.signal.aborted) setBalance(value); })
      .catch(error => { if (!abort.signal.aborted) setBalanceError(error.message); });
    return () => abort.abort();
  }, [dialog?.kind, item?.id_insumo, item?.id_equipamento]);
  function open(kind, row, mode) { action.setError(''); setType('ENTRADA'); setDialog({ kind, item: row, mode }); }
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get('quantidade'));
    const reason = String(form.get('motivo') ?? '').trim();
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647 || ['AJUSTE', 'PERDA', 'DEVOLUCAO'].includes(type) && !reason) { action.setError('Informe uma quantidade válida e o motivo quando necessário.'); return; }
    const sign = ['SAIDA', 'PERDA'].includes(type) || type === 'AJUSTE' && form.get('direcao') === 'SAIDA' ? -1 : 1;
    const body = { [dialog.kind === 'inputs' ? 'inputId' : 'equipmentId']: item[dialog.kind === 'inputs' ? 'id_insumo' : 'id_equipamento'], tipo: type, quantidade: sign * quantity, ...(reason ? { motivo: reason } : {}) };
    if (await action.run('inventory/movements', { method: 'POST', body }, 'Movimentação registrada.')) setDialog(null);
  }
  return <SupplierLayout title="Estoque" description="Acompanhe seus saldos e registre as movimentações necessárias.">
    {action.notice && <p className={styles.notice} role="status">{action.notice}</p>}
    <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Por cinema</h2><p>Filtre os itens vinculados à sua conta.</p></div></header><div className={styles.toolbar}><label className={styles.filter}>Cinema<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locations.items.map(row => <option key={row.id_local} value={row.id_local}>{locations.name(row.id_local)}</option>)}</select></label></div></section>
    {[['inputs', 'Insumos', inputs], ['equipment', 'Equipamentos', equipment]].map(([kind, title, list]) => <section key={kind} className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>{title}</h2><p>Saldo atual cadastrado.</p></div></header><SupplierState list={list} noun={title.toLowerCase()} empty="Nenhum item encontrado." />{list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Estoque de ${title.toLowerCase()}; role horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Item</th><th scope="col">Cinema</th><th scope="col">Em mãos</th>{kind === 'inputs' && <th scope="col">Mínimo</th>}<th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row[kind === 'inputs' ? 'id_insumo' : 'id_equipamento']}><th scope="row">{row.nome}</th><td>{locations.name(row.id_local)}</td><td>{row.quantidade}</td>{kind === 'inputs' && <td>{row.quantidade_minima}</td>}<td><span className={`${styles.badge} ${row.status !== 'DISPONIVEL' ? styles.inactive : ''}`}>{statusName(row.status)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver saldo" aria-label={`Ver saldo de ${row.nome}`} onClick={() => open(kind, row, 'balance')}><Gauge size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Movimentar" aria-label={`Movimentar ${row.nome}`} onClick={() => open(kind, row, 'move')}><ArrowLeftRight size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}<More list={list} noun="itens" /></section>)}
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Alertas de reposição</h2><p>Insumos com saldo disponível no mínimo.</p></div></header>{localId ? <><SupplierState list={alerts} noun="alertas" empty="Nenhum alerta para este cinema." />{alerts.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Disponível</th><th>Mínimo</th></tr></thead><tbody>{alerts.items.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.disponivel}</td><td>{row.quantidade_minima}</td></tr>)}</tbody></table></div>}<More list={alerts} noun="alertas" /></> : <p className={styles.state}>Selecione um cinema para consultar os alertas.</p>}</section>
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Movimentações</h2><p>Histórico dos seus itens.</p></div></header><SupplierState list={movements} noun="movimentações" empty="Nenhuma movimentação encontrada." />{movements.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Movimentações; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><thead><tr><th>Registro</th><th>Item</th><th>Tipo</th><th>Quantidade</th><th>Data</th><th>Motivo</th></tr></thead><tbody>{movements.items.map(row => <tr key={row.id_movimentacao}><th scope="row">#{row.id_movimentacao}</th><td>{row.nome_item ?? (row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`)}</td><td>{statusName(row.tipo)}</td><td>{row.quantidade > 0 ? '+' : ''}{row.quantidade}</td><td>{dateTime(row.data_movimentacao)}</td><td>{row.motivo || '—'}</td></tr>)}</tbody></table></div>}<More list={movements} noun="movimentações" /></section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.mode === 'move' ? 'Movimentar' : 'Saldo'} · {item?.nome}</DialogTitle><DialogDescription className={styles.dialogDescription}>{locations.name(item?.id_local)}</DialogDescription>{balanceError && <p className={styles.error} role="alert">{balanceError}</p>}{!balance && !balanceError && <p role="status">Carregando saldo…</p>}{balance && <div className={`${styles.summaryGrid} ${styles.stockSummary}`}><div><span>Em mãos</span><strong>{balance.quantidade}</strong></div><div><span>Reservado</span><strong>{balance.quantidade_reservada ?? 0}</strong></div><div><span>Disponível</span><strong>{balance.disponivel ?? balance.quantidade}</strong></div></div>}
      {dialog?.mode === 'move' && <form className={styles.form} onSubmit={save}><label>Tipo<select value={type} onChange={event => setType(event.target.value)}><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="AJUSTE">Ajuste</option><option value="PERDA">Perda</option><option value="DEVOLUCAO">Devolução</option></select></label><label>Quantidade<input name="quantidade" type="number" min="1" max="2147483647" required /></label>{type === 'AJUSTE' && <label>Direção<select name="direcao"><option value="ENTRADA">Aumentar</option><option value="SAIDA">Reduzir</option></select></label>}<label className={styles.wide}>Motivo<input name="motivo" maxLength={255} required={['AJUSTE', 'PERDA', 'DEVOLUCAO'].includes(type)} /></label>{action.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{action.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Cancelar</button><button type="submit" className={styles.primary} disabled={action.pending}>{action.pending ? 'Registrando…' : 'Registrar'}</button></div></form>}
      {dialog?.mode === 'balance' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Fechar</button><button type="button" className={styles.primary} onClick={() => open(dialog.kind, item, 'move')}>Movimentar</button></div>}
    </DialogContent></Dialog>
  </SupplierLayout>;
}
