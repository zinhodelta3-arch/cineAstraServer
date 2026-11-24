'use client';

import { maskCnpj } from "@/lib/br-fields.mjs";

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Archive, Building2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState } from './supply-layout';
import CompanyPicker from './company-picker';
import { peopleRequest } from '@/hooks/admin/use-admin-people';
import styles from '../catalog/catalog.module.css';


export default function SuppliersAdmin() {
  const [status, setStatus] = useState('');
  const list = useAdminSupply(`suppliers?limit=20${status ? `&status=${status}` : ''}`);
  const locals = useAdminVenues('locations?limit=100');
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;
  const users = useAdminSupply(actions.dialog?.type === 'form' && !item ? 'users?limit=100&role=FORNECEDOR&status=ATIVO' : null);
  const grants = useAdminSupply(actions.dialog?.type === 'grants' && item ? `suppliers/${item.id_fornecedor}/locations?limit=100` : null);

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { companyId: form.get('companyId') };
    if (!item) body.userId = form.get('userId');
    actions.run(() => supplyRequest(item ? `suppliers/${item.id_fornecedor}` : 'suppliers', { method: item ? 'PATCH' : 'POST', body }), item ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.');
  }
  function saveEmail(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email').trim();
    actions.run(() => peopleRequest(`users/${item.id_usuario}`, { method: 'PATCH', body: { email } }), 'E-mail atualizado.');
  }
  function grant(event) {
    event.preventDefault();
    const localId = String(new FormData(event.currentTarget).get('localId') ?? '');
    if (!localId || !item) { actions.setError('Selecione um cinema.'); return; }
    actions.run(() => supplyRequest(`suppliers/${item.id_fornecedor}/locations`, { method: 'POST', body: { localId } }), 'Cinema autorizado.');
  }
  const localName = id => locals.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}`;

  return <SupplyLayout title="Fornecedores" description="Cadastre fornecedores e autorize os cinemas atendidos." action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" />Vincular fornecedor</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="suppliers-title"><header className={styles.panelHeader}><div><h2 id="suppliers-title">Fornecedores cadastrados</h2><p>O vínculo com cada cinema é administrado separadamente.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label></div>
      <SupplyState list={list} empty="Nenhum fornecedor encontrado." noun="fornecedores" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de fornecedores; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Fornecedores</caption><thead><tr><th scope="col">Fornecedor</th><th scope="col">CNPJ</th><th scope="col">Conta</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_fornecedor}><th scope="row">{row.nome_cine || row.razao_social}<small className={styles.muted}> · #{row.id_fornecedor}</small></th><td>{maskCnpj(row.cnpj)}</td><td>{row.email || `#${row.id_usuario}`}</td><td><span className={`${styles.badge} ${row.status === 'ATIVO' ? '' : styles.inactive}`}>{row.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar fornecedor" aria-label={`Editar ${row.razao_social}`} onClick={() => actions.open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Gerenciar cinemas" aria-label={`Gerenciar cinemas de ${row.razao_social}`} onClick={() => actions.open('grants', row)}><Building2 size={16} aria-hidden="true" /></button><button type="button" className={styles.secondary} onClick={() => actions.open('email', row)}>Editar e-mail</button><button type="button" className={styles.iconButton} title={row.status === 'ATIVO' ? 'Arquivar fornecedor' : 'Reativar fornecedor'} aria-label={`${row.status === 'ATIVO' ? 'Arquivar' : 'Reativar'} ${row.razao_social}`} onClick={() => actions.open('status', row)}>{row.status === 'ATIVO' ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'grants' ? `Cinemas · ${item?.nome_cine || item?.razao_social}` : actions.dialog?.type === 'status' ? item?.status === 'ATIVO' ? 'Arquivar fornecedor' : 'Reativar fornecedor' : actions.dialog?.type === 'email' ? 'Editar e-mail da conta' : item ? 'Editar fornecedor' : 'Vincular fornecedor'}</DialogTitle>
      {actions.dialog?.type === 'form' && <><DialogDescription className={styles.dialogDescription}>A conta vinculada precisa ter perfil FORNECEDOR e estar ativa.</DialogDescription><form key={item?.id_fornecedor ?? 'new'} className={styles.form} onSubmit={save}>{!item && <label className={styles.wide}>Conta de fornecedor<select name="userId" required defaultValue=""><option value="">Selecione</option>{users.items.map(user => <option key={user.id} value={user.id}>{user.name} · #{user.id}</option>)}</select></label>}<CompanyPicker current={item} />{!item && <div className={styles.wide}>{users.error && <p className={styles.error} role="alert">{users.error}</p>}{!users.loading && !users.items.length && !users.error && <p className={styles.hint}>Nenhuma conta de fornecedor ativa encontrada.</p>}{users.nextCursor && <button type="button" className={styles.secondary} onClick={users.loadMore} disabled={users.loadingMore}>Mais contas</button>}</div>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar fornecedor'}</button></div></form></>}
      {actions.dialog?.type === 'grants' && <><DialogDescription className={styles.dialogDescription}>Autorize os cinemas nos quais o fornecedor pode operar.</DialogDescription><form className={styles.pickerControl} onSubmit={grant}><label>Cinema<select name="localId" required defaultValue=""><option value="">Selecione</option>{locals.items.filter(local => local.status === 'ATIVO').map(local => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label><button type="submit" className={styles.primary} disabled={actions.pending}>Autorizar cinema</button></form>{grants.loading && <p role="status">Carregando vínculos…</p>}{grants.error && <p className={styles.error} role="alert">{grants.error}</p>}{grants.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><caption className="sr-only">Cinemas autorizados</caption><thead><tr><th scope="col">Cinema</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{grants.items.map(row => <tr key={row.id_local}><th scope="row">{localName(row.id_local)}</th><td>{row.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</td><td><div className={styles.actions}>{row.status === 'ATIVO' && <button type="button" className={styles.iconButton} title="Revogar vínculo" aria-label={`Revogar ${localName(row.id_local)}`} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`suppliers/${item.id_fornecedor}/locations/${row.id_local}`, { method: 'DELETE' }), 'Vínculo revogado.')}><Trash2 size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}<TablePagination list={grants} noun="vínculos" />{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</>}
      {actions.dialog?.type === 'email' && <><DialogDescription className={styles.dialogDescription}>A alteração encerra as sessões da conta do fornecedor.</DialogDescription>
        <form className={styles.form} onSubmit={saveEmail}>
          <label className={styles.wide}>E-mail da conta<input name="email" type="email" maxLength={150} defaultValue={item.email ?? ''} required /></label>
          <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar e-mail'}</button></div>
        </form></>}
      {actions.dialog?.type === 'status' && <><DialogDescription className={styles.dialogDescription}>{item?.status === 'ATIVO' ? 'O fornecedor deixará de operar nos cinemas vinculados.' : 'A conta vinculada precisa estar ativa para reativar o fornecedor.'}</DialogDescription><div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === 'ATIVO' ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`suppliers/${item.id_fornecedor}`, item.status === 'ATIVO' ? { method: 'DELETE' } : { method: 'PATCH', body: { status: 'ATIVO' } }), item.status === 'ATIVO' ? 'Fornecedor arquivado.' : 'Fornecedor reativado.')}>{actions.pending ? 'Aguarde…' : item?.status === 'ATIVO' ? 'Arquivar' : 'Reativar'}</button></div></>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </SupplyLayout>;
}
