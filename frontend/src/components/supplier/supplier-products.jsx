'use client';
import { OperationFeedback } from '@/components/ui/list-feedback';

import { useState } from 'react';
import { useTablePreference } from '@/hooks/use-table-preference';
import MoneyInput from '@/components/ui/money-input';
import EquipmentPosition from '@/components/inventory/equipment-position';
import { Archive, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useSupplierAction, useSupplierList, useSupplierLocations, useSupplierSearch } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { More, SupplierSearch, SupplierState, statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';

export default function SupplierProducts({ kind }) {
  const input = kind === 'inputs';
  const singular = input ? 'insumo' : 'equipamento';
  const plural = input ? 'insumos' : 'equipamentos';
  const key = input ? 'id_insumo' : 'id_equipamento';
  const [scope, setScope] = useTablePreference(`${kind}:vínculo`,'own');
  const [localId, setLocalId] = useTablePreference(`${kind}:cinema`,'');
  const [status, setStatus] = useTablePreference(`${kind}:status`,'');
  const search = useSupplierSearch(kind);
  const [dialog, setDialog] = useState(null);
  const params = new URLSearchParams({ limit: '20', scope });
  if (scope === 'linked' && localId) params.set('localId', localId);
  if (status) params.set('status', status);
  const list = useSupplierList(`${kind}?${params}${search.parameter}`,`fornecedor:${kind}`);
  const categoryList = useSupplierList(dialog?.type === 'form' ? `${kind}/categories?limit=20` : null);
  const categories = categoryList.data?.options ?? [];
  const locations = useSupplierLocations(scope === 'linked');
  const action = useSupplierAction(list.reload);
  const item = dialog?.item;
  function open(type, row = null) { action.setError(''); setDialog({ type, item: row }); }
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = name => String(form.get(name) ?? '').trim();
    const name = value('nome'), description = value('descricao'), category = value('categoria');
    if (!name || name.length > 150 || description.length > 10000 || category.length > 100) { action.setError('Confira os dados do item.'); return; }
    const body = { nome: name, descricao: description || null, categoria: category || null };
    if (input) {
      const minimum = Number(value('quantidade_minima'));
      const price = value('preco');
      if (!Number.isInteger(minimum) || minimum < 0 || minimum > 2147483647) { action.setError('Confira o estoque mínimo.'); return; }
      Object.assign(body, { quantidade_minima: minimum, preco: price, venda_avulsa: form.has('venda_avulsa') });
    } else {
      const heritage = value('numero_patrimonio').toUpperCase();
      if (heritage.length > 100) { action.setError('O número de patrimônio é muito longo.'); return; }
      body.numero_patrimonio = heritage || null;
    }
    if (item) {
      body.status = value('status');
      for (const field of Object.keys(body)) if (body[field] === item[field]) delete body[field];
      if (!Object.keys(body).length) { action.setError('Nenhuma alteração para salvar.'); return; }
    }
    if (await action.run(item ? `${kind}/${item[key]}` : kind, { method: item ? 'PATCH' : 'POST', body }, item ? 'Item atualizado.' : 'Item cadastrado.')) setDialog(null);
  }
  async function changeStatus() {
    if (await action.run(`${kind}/${item[key]}`, item.status === 'DISPONIVEL' ? { method: 'DELETE' } : { method: 'PATCH', body: { status: 'DISPONIVEL' } }, item.status === 'DISPONIVEL' ? 'Item arquivado.' : 'Item reativado.')) setDialog(null);
  }
  return <SupplierLayout title={input ? 'Insumos' : 'Equipamentos'} description={`Gerencie os ${plural} da sua empresa.`} action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Novo {singular}</button>}>
    <OperationFeedback pending={action.pending} success={action.notice} className="mb-4"/>
    <section className={styles.panel}><header className={styles.panelHeader}><div><h2>{scope === "own" ? input ? "Insumos próprios" : "Equipamentos próprios" : input ? "Insumos vinculados a unidades" : "Equipamentos vinculados a unidades"}</h2></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><SupplierSearch {...search} placeholder="Nome ou categoria"/><label className={styles.filter}>Vínculo<select value={scope} onChange={event => { setScope(event.target.value); setLocalId(""); }}><option value="own">Estoque próprio</option><option value="linked">Vinculados a unidades</option></select></label>{scope === "linked" && <label className={styles.filter}>Unidade<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locations.items.map(row => <option key={row.id_local} value={row.id_local}>{row.id_local ? locations.name(row.id_local) : 'Sem cinema vinculado'}</option>)}</select></label>}{scope === "linked" && locations.nextCursor && <button type="button" className={styles.secondary} onClick={locations.loadMore} disabled={locations.loadingMore}>Mais unidades</button>}<label className={styles.filter}>Situação<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option><option value="DISPONIVEL">Disponível</option>{!input && <option value="MANUTENCAO">Manutenção</option>}<option value="INDISPONIVEL">Indisponível</option></select></label></div>
      <SupplierState list={list} noun={plural} empty={`Nenhum ${singular} encontrado.`} />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Tabela de ${plural}; role horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Nome</th><th scope="col">Proprietário</th><th scope="col">Unidade vinculada</th>{!input && <th scope="col">Posição</th>}<th scope="col">Quantidade</th>{input && <th scope="col">Preço</th>}<th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row[key]}><th scope="row">{row.nome}<small className={styles.muted}> · #{row[key]}</small></th><td>{row.nome_fornecedor ?? `Fornecedor #${row.id_fornecedor}`}</td><td>{row.id_local ? row.nome_local ?? locations.name(row.id_local) : 'Sem unidade vinculada'}</td>{!input && <td><EquipmentPosition item={row} /></td>}<td>{row.quantidade}</td>{input && <td>{Number(row.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>}<td><span className={`${styles.badge} ${row.status !== 'DISPONIVEL' ? styles.inactive : ''}`}>{statusName(row.status)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar" aria-label={`Editar ${row.nome}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${row.status === 'DISPONIVEL' ? styles.destructive : ''}`} title={row.status === 'DISPONIVEL' ? 'Arquivar' : 'Reativar'} aria-label={`${row.status === 'DISPONIVEL' ? 'Arquivar' : 'Reativar'} ${row.nome}`} onClick={() => open('status', row)}>{row.status === 'DISPONIVEL' ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <More list={list} noun={plural} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'status' ? `${item?.status === 'DISPONIVEL' ? 'Arquivar' : 'Reativar'} ${singular}` : item ? `Editar ${singular}` : `Novo ${singular}`}</DialogTitle><DialogDescription className={styles.dialogDescription}>{dialog?.type === 'status' ? `Confirme a alteração de ${item?.nome}.` : item ? 'Atualize os dados do item da sua empresa.' : 'O item será cadastrado no estoque do fornecedor.'}</DialogDescription>
      {dialog?.type === 'form' && <form key={item?.[key] ?? 'new'} className={styles.form} onSubmit={save}>
        <label>Nome<input name="nome" defaultValue={item?.nome ?? ''} maxLength={150} required /></label>
        <label>Categoria<select name="categoria" required={!item} defaultValue={item?.categoria ?? ''} disabled={categoryList.loading || !categories.length}>
          <option value="">{categoryList.loading ? 'Carregando categorias…' : 'Selecione uma categoria'}</option>
          {item?.categoria && !categories.includes(item.categoria) && <option value={item.categoria}>{item.categoria}</option>}
          {categories.map(category => <option key={category} value={category}>{category}</option>)}
        </select></label>
        <label className={styles.wide}>Descrição<textarea name="descricao" defaultValue={item?.descricao ?? ''} maxLength={10000} /></label>
        {input ? <>
          <label>Estoque mínimo<input name="quantidade_minima" type="number" min="0" max="2147483647" defaultValue={item?.quantidade_minima ?? 0} required /></label>
          <label>Preço (R$)<MoneyInput name="preco" defaultValue={item?.preco} required /></label>
          <label className={styles.wide}><input name="venda_avulsa" type="checkbox" defaultChecked={item?.venda_avulsa ?? false} />Venda avulsa</label>
          <p className={styles.wide}>A venda avulsa exige custos configurados pela administração e preço suficiente para cobri-los.</p>
        </> : <label>Número de patrimônio<input name="numero_patrimonio" defaultValue={item?.numero_patrimonio ?? ''} maxLength={100} /></label>}
        {item && <label>Status<select name="status" defaultValue={item.status}><option value="DISPONIVEL">Disponível</option>{!input && <option value="MANUTENCAO">Manutenção</option>}<option value="INDISPONIVEL">Indisponível</option></select></label>}
        {categoryList.error && <div className={styles.wide}><p className={styles.error} role="alert">{categoryList.error}</p><button type="button" className={styles.secondary} onClick={categoryList.reload}>Recarregar categorias</button></div>}
        {action.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{action.error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Cancelar</button><button type="submit" className={styles.primary} disabled={action.pending || !categories.length}>{action.pending ? 'Salvando…' : 'Salvar'}</button></div>
      </form>}
      {dialog?.type === 'status' && <>{action.error && <p className={styles.error} role="alert">{action.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Cancelar</button><button type="button" className={item.status === 'DISPONIVEL' ? styles.danger : styles.primary} disabled={action.pending} onClick={changeStatus}>{action.pending ? 'Aguarde…' : 'Confirmar'}</button></div></>}
    </DialogContent></Dialog>
  </SupplierLayout>;
}
