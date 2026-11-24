'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import TablePagination from '@/components/ui/table-pagination';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import { maskCnpj } from '@/lib/br-fields.mjs';
import styles from '../catalog/catalog.module.css';
import SupplyLayout, { SupplyState } from './supply-layout';

export default function CompaniesAdmin() {
  const [search, setSearch] = useState('');
  const list = useAdminSupply(`companies?limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}`);
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { razao_social: form.get('name').trim(), nome_cine: form.get('display').trim() || null };
    if (!item) body.cnpj = form.get('cnpj').replace(/[.\/-]/g, '').toUpperCase();
    actions.run(() => supplyRequest(item ? `companies/${item.id_empresa}` : 'companies', { method: item ? 'PATCH' : 'POST', body }),
      item ? 'Empresa atualizada.' : 'Empresa cadastrada.');
  }

  return <SupplyLayout title="Empresas fornecedoras" description="Consulte o cadastro por CNPJ e gerencie os dados compartilhados pelas contas de fornecedor."
    action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" />Nova empresa</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-label="Cadastro de empresas">
      <form className={styles.toolbar} onSubmit={event => { event.preventDefault(); setSearch(new FormData(event.currentTarget).get('q').trim()); }}>
        <label className={styles.filter}>Buscar empresa<input name="q" type="search" maxLength={150} placeholder="Razão social ou CNPJ" /></label>
        <button type="submit" className={styles.secondary}>Buscar</button>
      </form>
      <SupplyState list={list} empty="Nenhuma empresa encontrada." noun="empresas" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Empresas fornecedoras" tabIndex={0}>
        <table className={styles.table}><thead><tr><th scope="col">Razão social</th><th scope="col">Nome de exibição</th><th scope="col">CNPJ</th><th scope="col">Ações</th></tr></thead>
          <tbody>{list.items.map(row => <tr key={row.id_empresa}><th scope="row">{row.razao_social}</th><td>{row.nome_cine || '—'}</td><td>{maskCnpj(row.cnpj)}</td>
            <td><button type="button" className={styles.iconButton} aria-label={`Editar ${row.razao_social}`} onClick={() => actions.open('form', row)}><Pencil size={16} aria-hidden="true" /></button></td></tr>)}</tbody>
        </table>
      </div>}
      <TablePagination list={list} noun="empresas" />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={open => { if (!open) actions.close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>{item ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>Uma empresa pode ter várias contas de fornecedor.</DialogDescription>
        <form key={item?.id_empresa ?? 'new'} className={styles.form} onSubmit={save}>
          <label className={styles.wide}>Razão social<input name="name" maxLength={150} defaultValue={item?.razao_social} required /></label>
          <label>Nome de exibição<input name="display" maxLength={150} defaultValue={item?.nome_cine ?? ''} /></label>
          <label>CNPJ<input name="cnpj" maxLength={18} defaultValue={maskCnpj(item?.cnpj)} readOnly={Boolean(item)} required onChange={event => { event.currentTarget.value = maskCnpj(event.currentTarget.value); }} /></label>
          {actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}
          <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar empresa'}</button></div>
        </form>
      </DialogContent>
    </Dialog>
  </SupplyLayout>;
}
