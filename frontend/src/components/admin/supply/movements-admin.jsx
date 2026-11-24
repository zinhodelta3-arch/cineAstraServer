'use client';

import { useState } from 'react';
import { Pencil, Plus, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import TablePagination from '@/components/ui/table-pagination';
import { useAdminSnacks } from '@/hooks/admin/use-admin-snacks';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import styles from '../catalog/catalog.module.css';
import SupplyLayout, { SupplyState, dateTime } from './supply-layout';

const types = { ENTRADA: 'Entrada', SAIDA: 'Saída', AJUSTE: 'Ajuste', PERDA: 'Perda', DEVOLUCAO: 'Devolução' };
const title = { create: 'Nova movimentação', edit: 'Corrigir movimentação', reverse: 'Estornar movimentação' };
const notices = { create: 'Movimentação registrada.', edit: 'Movimentação corrigida.', reverse: 'Movimentação estornada.' };
const itemName = row => row.nome_item || (row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`);
const manual = row => row.id_local && !row.id_reserva && !row.id_logistica && !row.estorno_de && !row.estornada_por;

function MovementForm({ initialLocal, venueList, actions }) {
  const { type, item } = actions.dialog;
  const isNew = type === 'create';
  const [venue, setVenue] = useState(initialLocal);
  const [kind, setKind] = useState('inputs');
  const [movementType, setMovementType] = useState(item?.tipo ?? 'ENTRADA');
  const inputs = useAdminSnacks(isNew && venue && kind === 'inputs' ? `inputs?localId=${venue}&limit=20` : null);
  const equipment = useAdminSupply(isNew && venue && kind === 'equipment' ? `equipment?localId=${venue}&limit=20` : null);
  const items = kind === 'inputs' ? inputs : equipment;
  const itemKey = kind === 'inputs' ? 'id_insumo' : 'id_equipamento';

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { motivo: form.get('reason').trim() };
    if (!body.motivo) return actions.setError('Informe o motivo.');
    if (type !== 'reverse') {
      const negative = ['SAIDA', 'PERDA'].includes(movementType) || movementType === 'AJUSTE' && form.get('direction') === 'negative';
      body.tipo = movementType;
      body.quantidade = Number(form.get('quantity')) * (negative ? -1 : 1);
    }
    if (isNew) {
      body.localId = venue;
      body[kind === 'inputs' ? 'inputId' : 'equipmentId'] = form.get('itemId');
    }
    const path = isNew ? 'inventory/movements' : `inventory/movements/${item.id_movimentacao}`;
    const method = isNew ? 'POST' : type === 'edit' ? 'PATCH' : 'DELETE';
    actions.run(() => supplyRequest(path, { method, body }), notices[type]);
  }

  return <form className={styles.form} onSubmit={save}>
    {isNew && <>
      <label>Cinema<select value={venue} required onChange={event => setVenue(event.target.value)}>
        <option value="">Selecione</option>{venueList.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}
      </select></label>
      <label>Tipo de item<select value={kind} onChange={event => setKind(event.target.value)}><option value="inputs">Insumo</option><option value="equipment">Equipamento</option></select></label>
      {venueList.nextCursor && <button type="button" className={styles.secondary} onClick={venueList.loadMore} disabled={venueList.loadingMore}>Mais cinemas</button>}
      {venueList.error && <div role="alert"><p className={styles.error}>{venueList.error}</p><button type="button" className={styles.secondary} onClick={venueList.reload}>Tentar novamente</button></div>}
      <label className={styles.wide}>Item<select key={`${venue}:${kind}`} name="itemId" defaultValue="" required disabled={!venue || items.loading || !items.items.length}>
        <option value="">{items.loading ? 'Carregando…' : venue && !items.items.length ? 'Nenhum item encontrado' : 'Selecione'}</option>
        {items.items.map(row => <option key={row[itemKey]} value={row[itemKey]}>{row.nome} · saldo {row.quantidade} · #{row[itemKey]}</option>)}
      </select></label>
      {items.error && <div role="alert"><p className={styles.error}>{items.error}</p><button type="button" className={styles.secondary} onClick={items.reload}>Tentar novamente</button></div>}
      {items.nextCursor && <button type="button" className={styles.secondary} onClick={items.loadMore} disabled={items.loadingMore}>Mais itens</button>}
    </>}
    {type !== 'reverse' && <>
      <label>Movimentação<select value={movementType} onChange={event => setMovementType(event.target.value)}>
        {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" defaultValue={item ? Math.abs(item.quantidade) : ''} required /></label>
      {movementType === 'AJUSTE' && <label>Direção do ajuste<select name="direction" defaultValue={item?.quantidade < 0 ? 'negative' : 'positive'}><option value="positive">Aumentar</option><option value="negative">Reduzir</option></select></label>}
    </>}
    <label className={styles.wide}>Motivo<textarea name="reason" maxLength={255} required /></label>
    {actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}
    <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="submit" className={type === 'reverse' ? styles.danger : styles.primary} disabled={actions.pending || (isNew && !items.items.length)}>{actions.pending ? 'Aguarde…' : type === 'reverse' ? 'Confirmar estorno' : 'Salvar movimentação'}</button></div>
  </form>;
}

export default function MovementsAdmin() {
  const [venue, setVenue] = useState('');
  const venueList = useAdminVenues('locations?limit=100');
  const list = useAdminSupply(`inventory/movements?limit=20&scope=linked&order=recent${venue ? `&localId=${venue}` : ''}`);
  const actions = useSupplyActions(list);
  const { type, item } = actions.dialog ?? {};
  const venueName = id => venueList.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}`;

  return <SupplyLayout title="Movimentações" description="Consulte o histórico de estoque por cinema e corrija lançamentos manuais."
    action={<button type="button" className={styles.primary} onClick={() => actions.open('create')}><Plus size={16} aria-hidden="true" />Nova movimentação</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-label="Histórico de movimentações">
      <div className={styles.toolbar}><label className={styles.filter}>Cinema<select value={venue} onChange={event => setVenue(event.target.value)}><option value="">Todos os cinemas</option>{venueList.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label>
        {venueList.nextCursor && <button type="button" className={styles.secondary} onClick={venueList.loadMore} disabled={venueList.loadingMore}>Mais cinemas</button>}
      </div>
      <SupplyState list={list} empty="Nenhuma movimentação encontrada." noun="movimentações" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Movimentações de estoque" tabIndex={0}>
        <table className={styles.table}><thead><tr><th scope="col">Registro</th><th scope="col">Item e cinema</th><th scope="col">Movimentação</th><th scope="col">Quantidade</th><th scope="col">Motivo</th><th scope="col">Ações</th></tr></thead>
          <tbody>{list.items.map(row => <tr key={row.id_movimentacao}>
            <th scope="row">#{row.id_movimentacao}<div className={styles.muted}>{dateTime(row.data_movimentacao)}</div></th>
            <td>{itemName(row)}<div className={styles.muted}>{venueName(row.id_local)}</div></td>
            <td>{row.estorno_de ? `Estorno de #${row.estorno_de}` : row.estornada_por ? `Estornada por #${row.estornada_por}` : row.correcao_de ? `Correção de #${row.correcao_de}` : types[row.tipo] ?? row.tipo}</td>
            <td>{row.quantidade > 0 ? '+' : ''}{row.quantidade}</td><td>{row.motivo || '—'}</td>
            <td>{manual(row) ? <div className={styles.actions}>
              <button type="button" className={styles.iconButton} title="Corrigir" aria-label={`Corrigir movimentação ${row.id_movimentacao}`} onClick={() => actions.open('edit', row)}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" className={styles.iconButton} title="Estornar" aria-label={`Estornar movimentação ${row.id_movimentacao}`} onClick={() => actions.open('reverse', row)}><Undo2 size={16} aria-hidden="true" /></button>
            </div> : '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      <TablePagination list={list} noun="movimentações" />
    </section>
    <Dialog open={Boolean(type)} onOpenChange={open => { if (!open) actions.close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>{title[type]}</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>{item ? `#${item.id_movimentacao} · ${itemName(item)} · O saldo será atualizado e o lançamento original ficará no histórico.` : 'Escolha um item do cinema e informe o motivo do lançamento.'}</DialogDescription>
        {type && <MovementForm key={`${type}:${item?.id_movimentacao ?? ''}`} initialLocal={venue} venueList={venueList} actions={actions} />}
      </DialogContent>
    </Dialog>
  </SupplyLayout>;
}
