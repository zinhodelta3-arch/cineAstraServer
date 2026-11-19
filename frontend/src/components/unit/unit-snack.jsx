'use client';

import { useEffect, useState } from 'react';
import { ListPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitContext, useUnitList, useUnitTeam } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import UnitStockOperations from './unit-stock-operations';
import UnitSnackOffers from './unit-snack-offers';
import styles from './unit.module.css';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function UnitSnack({ canManage = false }) {
  const context = useUnitContext();
  const { team } = useUnitTeam();
  const sessionId = canManage ? null : team?.id_sessao;
  const localId = context.locations[0]?.id_local;
  const [revision, setRevision] = useState(0);
  const [stock, setStock] = useState({ inputs: [], equipment: [], loading: true, error: '' });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [view,setView] = useState(canManage ? 'offers' : 'combos');
  const [search,setSearch] = useState('');
  const comboQuery = new URLSearchParams({limit:'20',localId:localId??''});
  if(search) comboQuery.set('q',search);
  const combos = useUnitList(localId && view==='combos' ? `/combos?${comboQuery}` : null, unitOperation);

  useEffect(() => {
    if (!localId) return;
    const abort = new AbortController();
    unitOperation(`/stock?localId=${localId}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setStock({ inputs: data.inputs ?? [], equipment: data.equipment ?? [], loading: false, error: '' });
    }).catch(error => {
      if (!abort.signal.aborted) setStock({ inputs: [], equipment: [], loading: false, error: error.message });
    });
    return () => abort.abort();
  }, [localId, revision]);

  const selectedId = selected?.id_combo;
  useEffect(() => {
    if (!selectedId) return;
    const abort = new AbortController();
    unitOperation(`/combos/${selectedId}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setDetail({ data });
    }).catch(error => {
      if (!abort.signal.aborted) setDetail({ error: error.message });
    });
    return () => abort.abort();
  }, [selectedId]);

  function refreshStock() {
    setRevision(value => value + 1);
    combos.reload();
  }

  function selectCombo(row) {
    setDetail(null);
    setSelected(row);
  }

  return <UnitLayout title="AstraSnack da unidade" description="Acompanhe o estoque e consulte os combos disponíveis neste cinema." location={context.locations[0]?.nome}>
    <UnitFeedback error={context.error || stock.error} />
    <div className={styles.grid}>
      <div className={styles.card}><strong>Insumos</strong><p>{stock.loading ? 'Carregando…' : `${stock.inputs.length} itens neste cinema`}</p></div>
      <div className={styles.card}><strong>Combos</strong><p>Consulte a composição e o preço.</p></div>
      <div className={styles.card}><strong>Equipamentos</strong><p>{stock.loading ? 'Carregando…' : `${stock.equipment.length} itens neste cinema`}</p></div>
    </div>
    <div className={styles.toolbar}><label className={styles.field}>Consultar AstraSnack
      <select value={view} onChange={event=>setView(event.target.value)}>
        {canManage && <option value="offers">Oferta da unidade</option>}
        <option value="combos">Combos</option><option value="stock">Estoque local</option>
        <option value="sources">Solicitar reposição</option><option value="equipment">Solicitar equipamento</option>
        <option value="requests">Solicitações</option><option value="deliveries">Entregas</option>
        <option value="alerts">Alertas de reposição</option><option value="movements">Movimentações</option>
      </select></label></div>
    {view==='combos' && <section className={styles.panel}>
      <div className={styles.panelHeader}><div><h2>Combos</h2><p>Selecione um combo para consultar a composição e o preço oficial.</p></div></div>
      <div className={styles.body}>
        <form className={styles.form} onSubmit={event=>{event.preventDefault(); setSearch(String(new FormData(event.currentTarget).get('comboSearch')).trim());}}>
          <label>Buscar combo<input name="comboSearch" type="search" maxLength={150} defaultValue={search} /></label>
          <button className={styles.secondary}>Buscar</button>
        </form>
        <UnitListState list={combos} empty="Nenhum combo disponível neste cinema." />
        {combos.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">Combo</th><th scope="col">Insumos</th><th scope="col">Preço</th><th scope="col">Composição</th></tr></thead>
          <tbody>{combos.items.map(row => <tr key={row.id_combo}>
            <th scope="row">{row.nome}</th><td>{row.itemCount}</td><td>{brl.format(Number(row.preco))}</td>
            <td><button type="button" className={styles.iconButton} title="Ver composição" aria-label={`Ver composição de ${row.nome}`} onClick={() => selectCombo(row)}><ListPlus size={16} aria-hidden="true" /></button></td>
          </tr>)}</tbody>
        </table></div>}
        <UnitMore list={combos} noun="combos" />
      </div>
    </section>}
    {view==='stock' && <section className={`${styles.panel} ${styles.ticket}`}><div className={styles.panelHeader}><div><h2>Estoque local</h2><p>Saldos disponíveis para atendimento e composição.</p></div><button type="button" className={styles.secondary} disabled={!localId} onClick={refreshStock}>Atualizar</button></div><div className={styles.body}>{stock.loading && <p className={styles.empty}>Carregando estoque…</p>}{!stock.loading && !stock.inputs.length && <p className={styles.empty}>Nenhum insumo neste cinema.</p>}{stock.inputs.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Insumo</th><th>Em mãos</th><th>Disponível</th><th>Estado</th></tr></thead><tbody>{stock.inputs.map(row => <tr key={row.id_insumo}><th scope="row">{row.nome}</th><td>{row.quantidade}</td><td>{row.disponivel}</td><td><span className={styles.badge}>{label(row.status)}</span></td></tr>)}</tbody></table></div>}</div></section>}
    {view==='offers' && canManage && localId && <UnitSnackOffers refreshStock={refreshStock} />}
    {view!=='combos' && view!=='offers' && <UnitStockOperations view={view} canManage={canManage} sessionId={sessionId} localId={localId} inputs={stock.inputs} reloadStock={refreshStock} />}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>{detail?.data?.nome ?? selected?.nome}</DialogTitle>
        <DialogDescription>{detail?.data ? `Preço oficial de ${brl.format(Number(detail.data.preco))}` : 'Composição do combo da unidade.'}</DialogDescription>
        {!detail && <p role="status">Carregando composição…</p>}
        <UnitFeedback error={detail?.error} />
        {detail?.data && <ul className={styles.list}>
          {detail.data.items.map(part => <li key={part.id_insumo}><div><strong>{part.nome}</strong><small>{part.quantidade} por combo</small></div></li>)}
        </ul>}
      </DialogContent>
    </Dialog>
  </UnitLayout>;
}
