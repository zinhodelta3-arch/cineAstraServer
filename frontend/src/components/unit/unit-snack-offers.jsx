'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore } from './unit-layout';
import styles from './unit.module.css';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function UnitSnackOffers({ refreshStock }) {
  const [kind, setKind] = useState('inputs');
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const path = `/snack-offers/${kind}`;
  const list = useUnitList(`${path}?limit=20&offered=${!adding}${query ? `&q=${encodeURIComponent(query)}` : ''}`, unitOperation);
  const components = useUnitList(dialog?.mode === 'combo' ? `/snack-offers/combos/${dialog.row.id}/components` : null, unitOperation);
  const action = useUnitAction(list.reload, unitOperation);
  const row = dialog?.row;

  function open(mode, item, parent = null) {
    action.setError('');
    setDialog({ mode, row: item, parent });
  }

  async function changeOffer(item, offered) {
    if (await action.run(`${path}/${item.id}`, { method: 'PATCH', body: { offered } }, offered ? 'Item adicionado à oferta.' : 'Item retirado da oferta.')) setDialog(null);
  }

  async function adjust(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const quantity = Number(fields.get('quantity'));
    const reason = String(fields.get('reason')).trim();
    if (!Number.isInteger(quantity) || quantity < row.reserved || quantity > 2147483647 || !reason) {
      action.setError('Informe uma quantidade válida e o motivo do ajuste.');
      return;
    }
    if (await action.run(`/snack-offers/inputs/${row.id}/stock`, {
      method: 'PATCH', body: { quantity, expectedQuantity: row.quantity, reason },
    }, 'Ajuste de estoque registrado.')) {
      refreshStock();
      setDialog(dialog.parent ? { mode: 'combo', row: dialog.parent } : null);
    }
  }

  return <section className={styles.panel} aria-labelledby="unit-offer-title">
    <div className={styles.panelHeader}>
      <div><h2 id="unit-offer-title">{adding ? 'Adicionar à oferta' : 'Oferta da unidade'}</h2>
        <p>{adding ? 'Selecione itens já cadastrados no AstraSnack para esta unidade.' : 'Gerencie os itens disponíveis para venda e ajuste o estoque dos insumos.'}</p></div>
      <button type="button" className={styles.secondary} disabled={action.pending} onClick={() => { setAdding(!adding); setQuery(''); action.setError(''); }}>{adding ? 'Voltar à oferta' : 'Adicionar à oferta'}</button>
    </div>
    <div className={styles.body}>
      {!dialog && <UnitFeedback error={action.error} notice={action.notice} />}
      <form key={`${kind}:${adding}`} className={styles.form} onSubmit={event => { event.preventDefault(); setQuery(String(new FormData(event.currentTarget).get('search')).trim()); }}>
        <label>Tipo<select value={kind} onChange={event => { setKind(event.target.value); setQuery(''); }}><option value="inputs">Produtos</option><option value="combos">Combos</option></select></label>
        <label>Nome<input type="search" name="search" maxLength={150} placeholder="Buscar item" defaultValue={query} /></label>
        <button className={styles.secondary}>Buscar</button>
      </form>
      <UnitListState list={list} empty={adding ? 'Nenhum item de catálogo disponível para adicionar.' : 'Nenhum item deste tipo na oferta.'} />
      {list.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th scope="col">Item</th><th scope="col">Preço</th>{kind === 'inputs' && <th scope="col">Disponível</th>}<th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(item => <tr key={item.id}>
          <th scope="row">{item.name}</th><td>{brl.format(Number(item.price))}</td>{kind === 'inputs' && <td>{item.available}</td>}
          <td><div className={styles.actionRow}>{adding
            ? <button type="button" className={styles.secondary} disabled={action.pending} onClick={() => changeOffer(item, true)}>Adicionar</button>
            : <><button type="button" className={styles.secondary} onClick={() => open(kind === 'inputs' ? 'stock' : 'combo', item)}>Ajustar estoque</button>
              <button type="button" className={styles.secondary} onClick={() => open('remove', item)}>Retirar da oferta</button></>}</div></td>
        </tr>)}</tbody>
      </table></div>}
      <UnitMore list={list} noun={kind === 'inputs' ? 'produtos' : 'combos'} />
    </div>
    <Dialog open={Boolean(dialog)} onOpenChange={open => { if (!open && !action.pending) setDialog(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>{dialog?.mode === 'remove' ? 'Retirar da oferta' : 'Ajustar estoque'} · {row?.name}</DialogTitle>
        <DialogDescription>{dialog?.mode === 'remove' ? 'O cadastro e as reservas existentes serão preservados. Você pode adicionar o item de volta depois.' : dialog?.mode === 'combo' ? 'A disponibilidade do combo é calculada pelo estoque dos seus insumos.' : 'Informe a quantidade total em mãos, incluindo as unidades reservadas.'}</DialogDescription>
        <UnitFeedback error={action.error} notice={dialog?.mode === 'combo' ? action.notice : undefined} />
        {dialog?.mode === 'remove' && <button type="button" className={styles.button} disabled={action.pending} onClick={() => changeOffer(row, false)}>Confirmar retirada</button>}
        {dialog?.mode === 'combo' && <>
          <UnitListState list={components} empty="Nenhum insumo vinculado a este combo." />
          <ul className={styles.list}>{components.items.map(part => <li key={part.id}>
            <div><strong>{part.name}</strong><small>{part.perCombo} por combo · {part.available} disponíveis</small></div>
            <button type="button" className={styles.secondary} disabled={part.status !== 'DISPONIVEL'} onClick={() => open('stock', part, row)}>Ajustar insumo</button>
          </li>)}</ul>
        </>}
        {dialog?.mode === 'stock' && <form key={row.id} className={styles.form} onSubmit={adjust}>
          <p className={`${styles.full} ${styles.muted}`}>{row.available} disponíveis · {row.reserved} reservadas</p>
          <label>Quantidade em mãos<input name="quantity" type="number" min={row.reserved} max="2147483647" step="1" required defaultValue={row.quantity} /></label>
          <label className={styles.full}>Motivo do ajuste<input name="reason" required maxLength={255} placeholder="Ex.: conferência do estoque físico" /></label>
          <button className={styles.button} disabled={action.pending}>{action.pending ? 'Salvando…' : 'Salvar ajuste'}</button>
        </form>}
      </DialogContent>
    </Dialog>
  </section>;
}
