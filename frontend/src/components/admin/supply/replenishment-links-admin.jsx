'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import { useAdminSnacks } from '@/hooks/admin/use-admin-snacks';
import { SupplyState } from './supply-layout';
import styles from '../catalog/catalog.module.css';

export default function ReplenishmentLinksAdmin({ locals }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceId, setSourceId] = useState('');
  const list = useAdminSupply('input-links?limit=20');
  const actions = useSupplyActions(list);
  const editing = actions.dialog?.type === 'form';
  const sources = useAdminSnacks(editing && origin ? `inputs?limit=20&localId=${origin}&status=DISPONIVEL` : null);
  const source = sources.items.find(item => item.id_insumo === sourceId);
  const targets = useAdminSnacks(editing && source && destination
    ? `inputs?limit=20&localId=${destination}&supplierId=${source.id_fornecedor}&status=DISPONIVEL` : null);
  const activeLocals = locals.items.filter(local => local.status === 'ATIVO');

  function openForm() {
    setOrigin('');
    setDestination('');
    setSourceId('');
    actions.open('form');
  }

  function save(event) {
    event.preventDefault();
    const targetId = new FormData(event.currentTarget).get('targetId');
    if (!source || !targets.items.some(item => item.id_insumo === targetId)) return;
    actions.run(() => supplyRequest('input-links', { method: 'POST', body: { sourceId, targetId } }), 'Vínculo de reposição salvo.');
  }

  return <section className={styles.panel} aria-labelledby="replenishment-title">
    <header className={styles.panelHeader}>
      <div><h2 id="replenishment-title">Vínculos de reposição</h2><p>Direcione entregas ao saldo de um insumo já cadastrado no cinema de destino.</p></div>
      <button type="button" className={styles.primary} onClick={openForm}><Plus size={16} aria-hidden="true" />Vincular insumos</button>
    </header>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <SupplyState list={list} empty="Nenhum vínculo de reposição cadastrado." noun="vínculos" />
    {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Vínculos de reposição" tabIndex={0}>
      <table className={styles.table}>
        <thead><tr><th scope="col">Insumo de origem</th><th scope="col">Insumo de destino</th><th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(row => <tr key={row.id_vinculo}>
          <th scope="row">{row.nome_insumo_origem} <small>#{row.id_insumo_origem}</small><br /><span className={styles.muted}>{row.nome_local_origem}</span></th>
          <td>{row.nome_insumo_destino} <small>#{row.id_insumo_destino}</small><br /><span className={styles.muted}>{row.nome_local_destino}</span></td>
          <td><button type="button" className={styles.iconButton} aria-label={`Remover vínculo #${row.id_vinculo}`} onClick={() => actions.open('remove', row)}><Trash2 size={16} aria-hidden="true" /></button></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {list.nextCursor && <footer className={styles.footer}><button type="button" onClick={list.loadMore} disabled={list.loadingMore}>Carregar mais vínculos</button></footer>}
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>{editing ? 'Vincular insumos' : 'Remover vínculo'}</DialogTitle>
        <DialogDescription>{editing ? 'Escolha dois insumos do mesmo fornecedor. Salvar para a mesma origem e unidade substitui o vínculo anterior.' : 'As próximas entregas dessa origem serão recebidas em um registro separado.'}</DialogDescription>
        {editing ? <form className={styles.form} onSubmit={save}>
          <label>Unidade de origem<select required value={origin} onChange={event => { setOrigin(event.target.value); setSourceId(''); setDestination(''); }}><option value="">Selecione</option>{activeLocals.map(row => <option key={row.id_local} value={row.id_local}>{row.nome} · #{row.id_local}</option>)}</select></label>
          <label>Insumo de origem<select required disabled={!origin || sources.loading} value={sourceId} onChange={event => setSourceId(event.target.value)}><option value="">Selecione</option>{sources.items.map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome} · #{row.id_insumo}</option>)}</select></label>
          <label>Unidade de destino<select required value={destination} onChange={event => setDestination(event.target.value)}><option value="">Selecione</option>{activeLocals.filter(row => row.id_local !== origin).map(row => <option key={row.id_local} value={row.id_local}>{row.nome} · #{row.id_local}</option>)}</select></label>
          <label>Insumo de destino<select key={`${sourceId}:${destination}`} name="targetId" required disabled={!source || !destination || targets.loading}><option value="">Selecione</option>{targets.items.map(row => <option key={row.id_insumo} value={row.id_insumo}>{row.nome} · #{row.id_insumo}</option>)}</select></label>
          {source && destination && !targets.loading && !targets.error && targets.items.length === 0 && <p className={styles.wide}>Nenhum insumo disponível desse fornecedor na unidade de destino.</p>}
          {(sources.error || targets.error || locals.error) && <p className={styles.wide} role="alert">{sources.error || targets.error || locals.error}</p>}
          <div className={`${styles.wide} ${styles.dialogActions}`}>
            {locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais unidades</button>}
            {sources.nextCursor && <button type="button" className={styles.secondary} onClick={sources.loadMore} disabled={sources.loadingMore}>Mais insumos de origem</button>}
            {targets.nextCursor && <button type="button" className={styles.secondary} onClick={targets.loadMore} disabled={targets.loadingMore}>Mais insumos de destino</button>}
            <button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button>
            <button type="submit" className={styles.primary} disabled={actions.pending || targets.loading || !targets.items.length}>Salvar vínculo</button>
          </div>
        </form> : <div className={styles.dialogActions}>
          <button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button>
          <button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`input-links/${actions.dialog.item.id_vinculo}`, { method: 'DELETE' }), 'Vínculo removido.')}>Remover vínculo</button>
        </div>}
        {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
      </DialogContent>
    </Dialog>
  </section>;
}
