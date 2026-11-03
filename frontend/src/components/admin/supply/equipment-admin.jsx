'use client';

import { useEffect, useState } from 'react';
import { Archive, ArrowLeftRight, Pencil, Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState, statusName } from './supply-layout';
import styles from '../catalog/catalog.module.css';

export default function EquipmentAdmin() {
  const [localId, setLocalId] = useState('');
  const [status, setStatus] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [formLocalId, setFormLocalId] = useState('');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const list = useAdminSupply(`equipment?limit=20${localId ? `&localId=${localId}` : ''}${status ? `&status=${status}` : ''}`);
  const suppliers = useAdminSupply('suppliers?limit=100&status=ATIVO');
  const locals = useAdminVenues('locations?limit=100');
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;
  const grants = useAdminSupply(actions.dialog?.type === 'form' && !item && supplierId && formLocalId ? `suppliers/${supplierId}/locations?limit=100` : null);
  const grant = grants.items.find(row => row.id_local === formLocalId && row.status === 'ATIVO');

  useEffect(() => {
    if (actions.dialog?.type !== 'move' || !item) return;
    let active = true;
    setBalance(null); setBalanceLoading(true);
    supplyRequest(`inventory/equipment/${item.id_equipamento}`).then(value => { if (active) setBalance(value); })
      .catch(cause => { if (active) actions.setError(cause.message); })
      .finally(() => { if (active) setBalanceLoading(false); });
    return () => { active = false; };
  }, [actions.dialog?.type, item?.id_equipamento]);
  function open(type, row = null) { setSupplierId(row?.id_fornecedor ?? ''); setFormLocalId(row?.id_local ?? ''); actions.open(type, row); }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('nome') ?? '').trim();
    const description = String(form.get('descricao') ?? '').trim();
    const category = String(form.get('categoria') ?? '').trim();
    const heritage = String(form.get('numero_patrimonio') ?? '').trim().toUpperCase();
    if (!name || name.length > 150 || description.length > 10000 || category.length > 100 || heritage.length > 100) { actions.setError('Confira os dados do equipamento.'); return; }
    let body = { nome: name, descricao: description || null, categoria: category || null, numero_patrimonio: heritage || null };
    if (item) {
      body.status = String(form.get('status') ?? item.status);
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { actions.setError('Nenhuma alteração para salvar.'); return; }
    } else {
      if (!supplierId || !formLocalId || !grant) { actions.setError('Selecione um fornecedor autorizado para o cinema.'); return; }
      body = { ...body, supplierId, localId: formLocalId };
    }
    actions.run(() => supplyRequest(item ? `equipment/${item.id_equipamento}` : 'equipment', { method: item ? 'PATCH' : 'POST', body }), item ? 'Equipamento atualizado.' : 'Equipamento cadastrado.');
  }
  function move(event) {
    event.preventDefault();
    if (!item) return;
    const form = new FormData(event.currentTarget);
    const type = String(form.get('tipo'));
    const quantity = Number(form.get('quantidade'));
    const reason = String(form.get('motivo') ?? '').trim();
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) { actions.setError('Informe uma quantidade inteira positiva.'); return; }
    if (['AJUSTE', 'PERDA', 'DEVOLUCAO'].includes(type) && !reason) { actions.setError('Informe o motivo da movimentação.'); return; }
    const sign = type === 'AJUSTE' ? form.get('direcao') === 'SAIDA' ? -1 : 1 : ['SAIDA', 'PERDA'].includes(type) ? -1 : 1;
    actions.run(() => supplyRequest('inventory/movements', { method: 'POST', body: { equipmentId: item.id_equipamento, tipo: type, quantidade: quantity * sign, ...(reason ? { motivo: reason } : {}) } }), 'Movimentação registrada.');
  }
  const supplierName = id => suppliers.items.find(row => row.id_fornecedor === id)?.nome_cine || suppliers.items.find(row => row.id_fornecedor === id)?.razao_social || `Fornecedor #${id}`;
  const localName = id => locals.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}`;

  return <SupplyLayout title="Equipamentos" description="Cadastre equipamentos e acompanhe suas quantidades por cinema." action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Novo equipamento</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="equipment-title"><header className={styles.panelHeader}><div><h2 id="equipment-title">Equipamentos cadastrados</h2><p>Movimentações atualizam o saldo do equipamento.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Cinema<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{['DISPONIVEL', 'MANUTENCAO', 'INDISPONIVEL'].map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label></div>
      <SupplyState list={list} empty="Nenhum equipamento encontrado." noun="equipamentos" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de equipamentos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Equipamentos</caption><thead><tr><th scope="col">Equipamento</th><th scope="col">Cinema</th><th scope="col">Fornecedor</th><th scope="col">Patrimônio</th><th scope="col">Quantidade</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_equipamento}><th scope="row">{row.nome}<small className={styles.muted}> · #{row.id_equipamento}</small></th><td>{localName(row.id_local)}</td><td>{supplierName(row.id_fornecedor)}</td><td>{row.numero_patrimonio || '—'}</td><td>{row.quantidade}</td><td><span className={`${styles.badge} ${row.status === 'DISPONIVEL' ? '' : styles.inactive}`}>{statusName(row.status)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar equipamento" aria-label={`Editar ${row.nome}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Movimentar equipamento" aria-label={`Movimentar ${row.nome}`} onClick={() => open('move', row)}><ArrowLeftRight size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title={row.status === 'DISPONIVEL' ? 'Arquivar equipamento' : 'Reativar equipamento'} aria-label={`${row.status === 'DISPONIVEL' ? 'Arquivar' : 'Reativar'} ${row.nome}`} onClick={() => open('status', row)}>{row.status === 'DISPONIVEL' ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <footer className={styles.footer}><span>Exibindo {list.items.length} equipamentos{list.nextCursor ? ' · há mais' : ''}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? 'Carregando…' : 'Carregar mais'}</button></footer>
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'move' ? `Movimentar · ${item?.nome}` : actions.dialog?.type === 'status' ? item?.status === 'DISPONIVEL' ? 'Arquivar equipamento' : 'Reativar equipamento' : item ? 'Editar equipamento' : 'Novo equipamento'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{actions.dialog?.type === 'form' ? 'Selecione um fornecedor autorizado no cinema e informe os dados do equipamento.' : item ? `${localName(item.id_local)} · #${item.id_equipamento}` : ''}</DialogDescription>
      {actions.dialog?.type === 'form' && <form key={item?.id_equipamento ?? 'new'} className={styles.form} onSubmit={save}>{!item && <><label>Fornecedor<select value={supplierId} onChange={event => setSupplierId(event.target.value)} required><option value="">Selecione</option>{suppliers.items.map(row => <option key={row.id_fornecedor} value={row.id_fornecedor}>{row.nome_cine || row.razao_social}</option>)}</select></label><label>Cinema<select value={formLocalId} onChange={event => setFormLocalId(event.target.value)} required><option value="">Selecione</option>{locals.items.filter(row => row.status === 'ATIVO').map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label>{supplierId && formLocalId && <div className={styles.wide}>{grants.loading ? <p className={styles.hint}>Verificando vínculo…</p> : grant ? <p className={styles.hint}>Fornecedor autorizado neste cinema.</p> : <p className={styles.hint}>Autorize o fornecedor em <Link href="/admin/suprimentos">Fornecedores</Link> antes de cadastrar.</p>}{grants.error && <p className={styles.error} role="alert">{grants.error}</p>}</div>}</>}{item && <p className={`${styles.hint} ${styles.wide}`}>{supplierName(item.id_fornecedor)} · {localName(item.id_local)}. O vínculo não pode ser alterado.</p>}<label className={styles.wide}>Nome<input name="nome" maxLength={150} defaultValue={item?.nome ?? ''} required /></label><label>Categoria<input name="categoria" maxLength={100} defaultValue={item?.categoria ?? ''} /></label><label>Número de patrimônio<input name="numero_patrimonio" maxLength={100} defaultValue={item?.numero_patrimonio ?? ''} /></label>{item && <label>Status<select name="status" defaultValue={item.status}><option value="DISPONIVEL">Disponível</option><option value="MANUTENCAO">Em manutenção</option><option value="INDISPONIVEL">Indisponível</option></select></label>}<label className={styles.wide}>Descrição<textarea name="descricao" maxLength={10000} defaultValue={item?.descricao ?? ''} /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending || grants.loading}>{actions.pending ? 'Salvando…' : 'Salvar equipamento'}</button></div></form>}
      {actions.dialog?.type === 'move' && <>{balanceLoading && <p role="status">Carregando saldo…</p>}{balance && <div className={`${styles.summaryGrid} ${styles.stockSummary}`}><div><span>Em mãos</span><strong>{balance.quantidade}</strong></div><div><span>Cinema</span><strong>{localName(balance.id_local)}</strong></div><div><span>Status</span><strong>{statusName(balance.status)}</strong></div></div>}<form className={styles.form} onSubmit={move}><label>Tipo<select name="tipo" defaultValue="ENTRADA"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="AJUSTE">Ajuste</option><option value="PERDA">Perda</option><option value="DEVOLUCAO">Devolução</option></select></label><label>Quantidade<input name="quantidade" type="number" min="1" max="2147483647" required /></label><label>Direção do ajuste<select name="direcao" defaultValue="ENTRADA"><option value="ENTRADA">Aumentar</option><option value="SAIDA">Reduzir</option></select></label><label className={styles.wide}>Motivo<input name="motivo" maxLength={255} placeholder="Obrigatório para ajustes, perdas e devoluções" /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Registrando…' : 'Registrar movimentação'}</button></div></form></>}
      {actions.dialog?.type === 'status' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === 'DISPONIVEL' ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`equipment/${item.id_equipamento}`, item.status === 'DISPONIVEL' ? { method: 'DELETE' } : { method: 'PATCH', body: { status: 'DISPONIVEL' } }), item.status === 'DISPONIVEL' ? 'Equipamento arquivado.' : 'Equipamento reativado.')}>{actions.pending ? 'Aguarde…' : item?.status === 'DISPONIVEL' ? 'Arquivar' : 'Reativar'}</button></div>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </SupplyLayout>;
}
