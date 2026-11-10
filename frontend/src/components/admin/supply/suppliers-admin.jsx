'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Archive, Building2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState } from './supply-layout';
import styles from '../catalog/catalog.module.css';

const formatCnpj = value => { const raw = String(value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase(); return raw.length === 14 ? `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}` : raw; };

export default function SuppliersAdmin() {
  const [status, setStatus] = useState('');
  const list = useAdminSupply(`suppliers?limit=20${status ? `&status=${status}` : ''}`);
  const users = useAdminSupply('users?limit=100&role=FORNECEDOR&status=ATIVO');
  const locals = useAdminVenues('locations?limit=100');
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;
  const grants = useAdminSupply(actions.dialog?.type === 'grants' && item ? `suppliers/${item.id_fornecedor}/locations?limit=100` : null);

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('razao_social') ?? '').trim();
    const display = String(form.get('nome_cine') ?? '').trim();
    const cnpj = String(form.get('cnpj') ?? '').trim().toUpperCase();
    if (!name || name.length > 150 || display.length > 150 || !/^[A-Z0-9]{12}\d{2}$/.test(cnpj.replace(/[.\/-]/g, ''))) { actions.setError('Confira razão social, nome de exibição e CNPJ.'); return; }
    let body = { razao_social: name, nome_cine: display || null, cnpj };
    if (item) {
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { actions.setError('Nenhuma alteração para salvar.'); return; }
    } else {
      const userId = String(form.get('userId') ?? '');
      if (!userId) { actions.setError('Selecione uma conta de fornecedor ativa.'); return; }
      body.userId = userId;
    }
    actions.run(() => supplyRequest(item ? `suppliers/${item.id_fornecedor}` : 'suppliers', { method: item ? 'PATCH' : 'POST', body }), item ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.');
  }
  function grant(event) {
    event.preventDefault();
    const localId = String(new FormData(event.currentTarget).get('localId') ?? '');
    if (!localId || !item) { actions.setError('Selecione um cinema.'); return; }
    actions.run(() => supplyRequest(`suppliers/${item.id_fornecedor}/locations`, { method: 'POST', body: { localId } }), 'Cinema autorizado.');
  }
  const localName = id => locals.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}`;

  return <SupplyLayout title="Fornecedores" description="Cadastre fornecedores e autorize os cinemas atendidos." action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" />Novo fornecedor</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="suppliers-title"><header className={styles.panelHeader}><div><h2 id="suppliers-title">Fornecedores cadastrados</h2><p>O vínculo com cada cinema é administrado separadamente.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label></div>
      <SupplyState list={list} empty="Nenhum fornecedor encontrado." noun="fornecedores" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de fornecedores; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Fornecedores</caption><thead><tr><th scope="col">Fornecedor</th><th scope="col">CNPJ</th><th scope="col">Conta</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_fornecedor}><th scope="row">{row.nome_cine || row.razao_social}<small className={styles.muted}> · #{row.id_fornecedor}</small></th><td>{formatCnpj(row.cnpj)}</td><td>#{row.id_usuario}</td><td><span className={`${styles.badge} ${row.status === 'ATIVO' ? '' : styles.inactive}`}>{row.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar fornecedor" aria-label={`Editar ${row.razao_social}`} onClick={() => actions.open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Gerenciar cinemas" aria-label={`Gerenciar cinemas de ${row.razao_social}`} onClick={() => actions.open('grants', row)}><Building2 size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title={row.status === 'ATIVO' ? 'Arquivar fornecedor' : 'Reativar fornecedor'} aria-label={`${row.status === 'ATIVO' ? 'Arquivar' : 'Reativar'} ${row.razao_social}`} onClick={() => actions.open('status', row)}>{row.status === 'ATIVO' ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'grants' ? `Cinemas · ${item?.nome_cine || item?.razao_social}` : actions.dialog?.type === 'status' ? item?.status === 'ATIVO' ? 'Arquivar fornecedor' : 'Reativar fornecedor' : item ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
      {actions.dialog?.type === 'form' && <><DialogDescription className={styles.dialogDescription}>A conta vinculada precisa ter perfil FORNECEDOR e estar ativa.</DialogDescription><form key={item?.id_fornecedor ?? 'new'} className={styles.form} onSubmit={save}>{!item && <label className={styles.wide}>Conta de fornecedor<select name="userId" required defaultValue=""><option value="">Selecione</option>{users.items.map(user => <option key={user.id} value={user.id}>{user.name} · #{user.id}</option>)}</select></label>}<label className={styles.wide}>Razão social<input name="razao_social" maxLength={150} defaultValue={item?.razao_social ?? ''} required /></label><label>Nome de exibição<input name="nome_cine" maxLength={150} defaultValue={item?.nome_cine ?? ''} /></label><label>CNPJ<input name="cnpj" maxLength={18} defaultValue={item?.cnpj ?? ''} placeholder="00.000.000/0000-00" required /></label>{!item && <div className={styles.wide}>{users.error && <p className={styles.error} role="alert">{users.error}</p>}{!users.loading && !users.items.length && !users.error && <p className={styles.hint}>Nenhuma conta de fornecedor ativa encontrada.</p>}{users.nextCursor && <button type="button" className={styles.secondary} onClick={users.loadMore} disabled={users.loadingMore}>Mais contas</button>}</div>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar fornecedor'}</button></div></form></>}
      {actions.dialog?.type === 'grants' && <><DialogDescription className={styles.dialogDescription}>Autorize os cinemas nos quais o fornecedor pode operar.</DialogDescription><form className={styles.pickerControl} onSubmit={grant}><label>Cinema<select name="localId" required defaultValue=""><option value="">Selecione</option>{locals.items.filter(local => local.status === 'ATIVO').map(local => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label><button type="submit" className={styles.primary} disabled={actions.pending}>Autorizar cinema</button></form>{grants.loading && <p role="status">Carregando vínculos…</p>}{grants.error && <p className={styles.error} role="alert">{grants.error}</p>}{grants.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><caption className="sr-only">Cinemas autorizados</caption><thead><tr><th scope="col">Cinema</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{grants.items.map(row => <tr key={row.id_local}><th scope="row">{localName(row.id_local)}</th><td>{row.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</td><td><div className={styles.actions}>{row.status === 'ATIVO' && <button type="button" className={styles.iconButton} title="Revogar vínculo" aria-label={`Revogar ${localName(row.id_local)}`} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`suppliers/${item.id_fornecedor}/locations/${row.id_local}`, { method: 'DELETE' }), 'Vínculo revogado.')}><Trash2 size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}<TablePagination list={grants} noun="vínculos" />{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</>}
      {actions.dialog?.type === 'status' && <><DialogDescription className={styles.dialogDescription}>{item?.status === 'ATIVO' ? 'O fornecedor deixará de operar nos cinemas vinculados.' : 'A conta vinculada precisa estar ativa para reativar o fornecedor.'}</DialogDescription><div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === 'ATIVO' ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`suppliers/${item.id_fornecedor}`, item.status === 'ATIVO' ? { method: 'DELETE' } : { method: 'PATCH', body: { status: 'ATIVO' } }), item.status === 'ATIVO' ? 'Fornecedor arquivado.' : 'Fornecedor reativado.')}>{actions.pending ? 'Aguarde…' : item?.status === 'ATIVO' ? 'Arquivar' : 'Reativar'}</button></div></>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </SupplyLayout>;
}
