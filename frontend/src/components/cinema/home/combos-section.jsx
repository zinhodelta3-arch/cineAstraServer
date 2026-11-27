"use client";

import ProductImage from '@/components/cinema/astrasnack/product-image';
import Link from 'next/link';
import { useHomeCombos } from '@/hooks/cinema/home/use-home-combos';
import { SectionTitle } from './home-ui';
import ListStatus from './list-status';
export default function CombosSection() {
 const { ready, localId, locations, combos, snacks, products } = useHomeCombos();
 return <section id="combos" className="bg-card/40 py-20"><div className="mx-auto max-w-[1600px] px-5 md:px-8">
  <SectionTitle eyebrow="Bomboniere" title="Combos e delícias" description="A disponibilidade dos insumos varia de acordo com a unidade." />
  {ready && !localId && <ListStatus list={locations} empty="Escolha um cinema no cabeçalho para consultar produtos e combos." showMore={false} />}
  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map(p => <article key={p.id} className="ticket flex min-w-0 flex-col overflow-hidden border border-border bg-card" style={{'--n':'85%'}}>
   <div className="relative aspect-[4/3] overflow-hidden bg-muted"><ProductImage src={p.image} alternatives={[p.alternateImage]} className="h-full w-full" showMissing /><span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{p.category}</span></div>
   <div className="flex flex-1 flex-col p-5"><h3 className="text-lg font-bold leading-snug">{p.name}</h3><p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground line-clamp-2">{p.description}</p><div className="tear mt-5 pt-4"><span className="text-xs text-muted-foreground">Valor</span><div className="flex flex-wrap items-end justify-between gap-3"><strong className="f-display text-4xl font-black leading-none text-primary">{Number(p.price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong><Link href="/cinema/astrasnack" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Ver no AstraSnack</Link></div></div></div>
  </article>)}</div>
  {localId && <>
   <ListStatus list={combos} empty="" showMore={false} />
   <ListStatus list={snacks} empty="" showMore={false} />
   {products.length > 0 && (
    <Link href="/cinema/astrasnack" prefetch={false}
     className="inline-flex items-center rounded-full border border-border bg-background/50 px-6 py-3 text-sm font-bold text-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
     Veja mais
    </Link>
   )}
   {!products.length && !combos.loading && !snacks.loading && !combos.error && !snacks.error && <p className="mt-6">Nenhum item disponível neste cinema.</p>}
  </>}
 </div></section>;
}
