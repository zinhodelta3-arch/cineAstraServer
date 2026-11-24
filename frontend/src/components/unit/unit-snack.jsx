'use client';

import { useEffect, useState } from 'react';
import { ListPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import UnitStockOperations from './unit-stock-operations';
import UnitSnackOffers from './unit-snack-offers';
import styles from './unit.module.css';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const replenishmentViews = ['sources','equipment','requests','deliveries'];
const emptyStock = { inputs:[], equipment:[], loading:true, error:'', canRecord:false };

function StockTable({ rows, equipment = false }) {
  const title = equipment ? 'Equipamentos' : 'Insumos';
  return <section aria-label={title}>
    <h3>{title}</h3>
    {!rows.length ? <p className={styles.empty}>{equipment ? 'Nenhum equipamento neste cinema.' : 'Nenhum insumo neste cinema.'}</p>
      : <div className={styles.tableWrap} role="region" tabIndex={0} aria-label={`Saldos de ${title.toLowerCase()}`}>
        <table className={styles.table}><thead><tr>
          <th scope="col">{equipment ? 'Equipamento' : 'Insumo'}</th><th scope="col">Em mãos</th>
          {!equipment && <th scope="col">Disponível</th>}<th scope="col">Estado</th>
        </tr></thead><tbody>{rows.map(row => <tr key={equipment ? row.id_equipamento : row.id_insumo}>
          <th scope="row">{row.nome}</th><td>{row.quantidade}</td>{!equipment && <td>{row.disponivel}</td>}
          <td><span className={styles.badge}>{label(row.status)}</span>
            {equipment && !row.movimentavel && row.status === 'EM_ESTOQUE' && <small>Bloqueado para movimentação avulsa</small>}
          </td>
        </tr>)}</tbody></table>
      </div>}
  </section>;
}

export default function UnitSnack({ canManage = false }) {
  const context = useUnitContext();
  const [locationId, setLocationId] = useState('');
  const [sessionChoice, setSessionChoice] = useState('');
  const location = context.locations.find(item => item.id_local === locationId) ?? context.locations[0];
  const localId = location?.id_local;
  const [revision, setRevision] = useState(0);
  const [stockResult, setStock] = useState(null);
  const stock = localId && stockResult?.localId === localId ? stockResult : emptyStock;
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [view,setView] = useState(canManage ? 'offers' : 'stock');
  const [search,setSearch] = useState('');
  const replenishment = replenishmentViews.includes(view);
  const teams = useUnitList(!canManage && replenishment ? '?limit=20' : null);
  const sessionOptions = [...new Map(teams.items.filter(team => team.location?.id===localId && team.myFunction &&
    ['ATIVA','FINALIZADA'].includes(team.status) && (
      ['sources','equipment'].includes(view) ? team.status==='ATIVA' && team.sessionOpen
        : Boolean(team.sessionStatus)))
    .map(team => [team.id_sessao,team])).values()];
  const team = sessionOptions.find(item => item.id_sessao===sessionChoice) ?? (sessionOptions.length===1 ? sessionOptions[0] : null);
  const sessionId = team?.id_sessao;
  const activeSession = view==='stock' ? stock.canRecord : team?.status==='ATIVA' && team.sessionOpen;
  const comboQuery = new URLSearchParams({limit:'20',localId:localId??''});
  if(search) comboQuery.set('q',search);
  const combos = useUnitList(localId && view==='combos' ? `/combos?${comboQuery}` : null, unitOperation);

  useEffect(() => {
    if (!localId) return;
    const abort = new AbortController();
    unitOperation(`/stock?localId=${localId}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setStock({ localId, inputs:data.inputs ?? [], equipment:data.equipment ?? [], loading:false, error:'', canRecord:data.can_record });
    }).catch(error => {
      if (!abort.signal.aborted) setStock({ ...emptyStock, localId, loading:false, error:error.message });
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

  return <UnitLayout title="AstraSnack da unidade" description="Acompanhe o estoque e consulte os combos disponíveis neste cinema." location={location?.nome}>
    <UnitFeedback error={context.error || stock.error} />
    <div className={styles.grid}>
      <div className={styles.card}><strong>Insumos</strong><p>{stock.loading ? 'Carregando…' : `${stock.inputs.length} itens neste cinema`}</p></div>
      <div className={styles.card}><strong>Combos</strong><p>Consulte a composição e o preço.</p></div>
      <div className={styles.card}><strong>Equipamentos</strong><p>{stock.loading ? 'Carregando…' : `${stock.equipment.length} itens neste cinema`}</p></div>
    </div>
    <div className={styles.toolbar}>
      {context.locations.length > 1 && <label className={styles.field}>Cinema<select value={localId ?? ''} onChange={event=>{setLocationId(event.target.value); setSessionChoice('');}}>
        {context.locations.map(item=><option key={item.id_local} value={item.id_local}>{item.nome}</option>)}
      </select></label>}
      <label className={`${styles.field} min-w-48`}>Consultar AstraSnack
      <select value={view} onChange={event=>setView(event.target.value)}>
        {canManage && <option value="offers">Oferta da unidade</option>}
        <option value="combos">Combos</option><option value="stock">Estoque local</option>
        <option value="sources">{canManage ? 'Solicitar reposição' : 'Sugerir reposição'}</option><option value="equipment">{canManage ? 'Solicitar equipamento' : 'Sugerir equipamento'}</option>
        <option value="requests">Solicitações</option><option value="deliveries">Entregas</option>
        <option value="alerts">Alertas de reposição</option><option value="movements">Movimentações</option>
      </select></label>
      {!canManage && replenishment && <>
        <label className={styles.field}>Sessão da equipe<select value={sessionId ?? ''} onChange={event=>setSessionChoice(event.target.value)} disabled={teams.loading || !sessionOptions.length}>
          <option value="">{teams.loading ? 'Carregando sessões…' : 'Selecione'}</option>
          {sessionOptions.map(item=><option key={item.id_sessao} value={item.id_sessao}>{item.nome} · {item.schedule?.date?.split('-').reverse().join('/')} {item.schedule?.start?.slice(0,5)}</option>)}
        </select></label>
        {teams.nextCursor && <button type="button" className={styles.secondary} onClick={teams.loadMore} disabled={teams.loadingMore}>Mais sessões</button>}
      </>}
    </div>
    {!canManage && replenishment && <UnitFeedback error={teams.error} />}
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
    {view==='stock' && <section className={`${styles.panel} ${styles.ticket}`}>
      <header className={styles.panelHeader}><h2>Estoque local</h2><button type="button" className={styles.secondary} disabled={!localId} onClick={refreshStock}>Atualizar</button></header>
      <div className={`${styles.body} ${styles.stack}`}>
        {stock.loading ? <p role="status">Carregando estoque…</p> : !stock.error && <>
          <StockTable rows={stock.inputs} />
          <StockTable rows={stock.equipment} equipment />
        </>}
      </div>
    </section>}
    {view==='offers' && canManage && localId && <UnitSnackOffers refreshStock={refreshStock} />}
    {view!=='combos' && view!=='offers' && (view!=='stock'||!stock.loading&&!stock.error) && <UnitStockOperations key={`${localId ?? ''}:${sessionId ?? ''}`} view={view} canManage={canManage} sessionId={sessionId}
      activeSession={activeSession} localId={localId} inputs={stock.inputs} equipment={stock.equipment} reloadStock={refreshStock} />}
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
