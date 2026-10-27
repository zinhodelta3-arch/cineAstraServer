"use client";
import { useHomeCombos } from '@/hooks/cinema/home/use-home-combos';
import { SectionTitle } from './home-ui';
import ListStatus from './list-status';
export default function CombosSection() {
 const { localId, setLocalId, locations, combos } = useHomeCombos();
 return <section id="combos" className="bg-card/40 py-20"><div className="mx-auto max-w-[1600px] px-5 md:px-8">
  <SectionTitle eyebrow="Bomboniere" title="Combos e delícias" description="Escolha seu cinema para consultar os combos disponíveis." />
  <label className="block max-w-lg">Cinema<select value={localId} onChange={e => setLocalId(e.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-background p-3"><option value="">Selecione o cinema</option>{locations.items.map(l => <option key={l.id_local} value={l.id_local}>{l.nome} — {l.cidade}</option>)}</select></label>
  <ListStatus list={locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas" />
  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{combos.items.map(c => <article key={c.id_combo} className="ticket border border-border bg-card p-6"><h3 className="f-display text-3xl font-bold">{c.nome}</h3><p className="my-3 text-muted-foreground">{c.descricao}</p><ul className="mb-4 text-sm">{c.items.map(i => <li key={i.id_insumo}>{i.quantidade} × {i.nome}</li>)}</ul><p className="text-2xl font-bold text-primary">{Number(c.preco).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p><p className="mt-2 text-xs text-muted-foreground">Preço cadastrado. Valor final confirmado na compra.</p></article>)}</div>
  {localId && <ListStatus list={combos} empty="Nenhum combo disponível neste cinema." />}
 </div></section>;
}
