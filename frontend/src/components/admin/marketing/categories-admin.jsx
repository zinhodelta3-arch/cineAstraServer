'use client';

import { Archive, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { marketingRequest, useAdminMarketing, useMarketingActions } from '@/hooks/admin/use-admin-marketing';
import MarketingLayout, { MarketingState } from './marketing-layout';
import styles from '../catalog/catalog.module.css';
import TablePagination from '@/components/ui/table-pagination';

export default function CategoriesAdmin() {
  const list = useAdminMarketing('categories');
  const actions = useMarketingActions(list), item = actions.dialog?.item;
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), name = String(form.get('name') ?? '').trim(), description = String(form.get('description') ?? '').trim() || null, code = String(form.get('code') ?? '').trim().toUpperCase();
    if (!name || name.length > 100 || !item && !/^[A-Z][A-Z0-9_]{0,49}$/.test(code)) { actions.setError('Confira nome e código da categoria.'); return; }
    const body = item ? { name, description } : { code, name, description };
    actions.run(() => marketingRequest(`categories${item ? `/${item.id}` : ''}`, { method: item ? 'PATCH' : 'POST', body }), item ? 'Categoria atualizada.' : 'Categoria cadastrada.');
  }
  return <MarketingLayout title="Categorias" description="Organize os assuntos que o público pode acompanhar por e-mail." action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" />Nova categoria</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="categories-title"><header className={styles.panelHeader}><div><h2 id="categories-title">Categorias da newsletter</h2><p>O código identifica a categoria nas preferências de inscrição.</p></div><span className={styles.count}>{list.items.length} cadastradas</span></header>
      <MarketingState list={list} empty="Nenhuma categoria cadastrada." noun="categorias" />{list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de categorias; deslize horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Categorias da newsletter</caption><thead><tr><th scope="col">Categoria</th><th scope="col">Código</th><th scope="col">Descrição</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{row.name}<small className={styles.muted}> · #{row.id}</small></th><td>{row.code}</td><td>{row.description || '—'}</td><td><span className={`${styles.badge} ${row.active ? '' : styles.inactive}`}>{row.active ? 'Ativa' : 'Arquivada'}</span></td><td><div className={styles.actions}>{row.active && <><button type="button" className={styles.iconButton} title="Editar categoria" aria-label={`Editar ${row.name}`} onClick={() => actions.open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Arquivar categoria" aria-label={`Arquivar ${row.name}`} onClick={() => actions.open('archive', row)}><Archive size={16} aria-hidden="true" /></button></>}</div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} noun="categorias" />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'archive' ? 'Arquivar categoria' : item ? 'Editar categoria' : 'Nova categoria'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{actions.dialog?.type === 'archive' ? 'Campanhas agendadas desta categoria serão canceladas.' : 'As categorias ativas podem ser usadas nas campanhas da newsletter.'}</DialogDescription>
      {actions.dialog?.type === 'form' && <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}>{!item && <label>Código<input name="code" maxLength={50} placeholder="NOVIDADES_CINEMA" required /></label>}<label className={item ? styles.wide : ''}>Nome<input name="name" maxLength={100} defaultValue={item?.name ?? ''} required /></label><label className={styles.wide}>Descrição<textarea name="description" maxLength={255} defaultValue={item?.description ?? ''} /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar categoria'}</button></div></form>}
      {actions.dialog?.type === 'archive' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => marketingRequest(`categories/${item.id}`, { method: 'DELETE' }), 'Categoria arquivada.')}>{actions.pending ? 'Aguarde…' : 'Arquivar'}</button></div>}{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </MarketingLayout>;
}
