"use client";
import { Film } from 'lucide-react';
import Link from 'next/link';
import { useHomeContent } from '@/hooks/cinema/home/use-home-content';
import { SmartImg, SectionTitle } from './home-ui';
import ListStatus from './list-status';
export default function HomeContentSection({ kind = 'experiences' }) {
 const list = useHomeContent(kind), banners = kind === 'banners';
 return <section className="max-w-[1600px] mx-auto px-5 md:px-8 py-16" aria-label={banners ? 'Destaques' : 'Experiências'}>
  <SectionTitle eyebrow="CineAstra" title={banners ? 'Destaques' : 'Experiências'} />
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{list.items.map(item => <article key={item.id} className="relative overflow-hidden rounded-xl border border-border bg-card motion-safe:transition-colors hover:border-primary/50 focus-within:border-primary">
   <div className="aspect-video"><SmartImg src={item.imageUrl} alt={item.imageAlt || item.title} title={item.title} icon={Film} /></div>
   <div className="p-6 space-y-3">{item.tag && <span className="text-sm text-primary">{item.tag}</span>}<h3 className="f-display text-3xl font-bold">{item.title}</h3><p className="text-muted-foreground">{item.summary}</p>
    {item.priceLabel && <p>{item.priceLabel} {item.unit}</p>}
    {!banners && <Link className="inline-flex min-h-11 items-center rounded-full border border-primary px-5 py-2 font-semibold text-primary after:absolute after:inset-0 focus-visible:ring-2"
      href={`/cinema/experiencias#experiencia-${encodeURIComponent(item.id)}`} aria-label={`Ver detalhes de ${item.title}`}>Ver detalhes →</Link>}
    {banners && item.targetUrl && <a className="inline-block rounded-full border border-primary px-5 py-2 font-semibold text-primary focus-visible:ring-2" href={item.targetUrl}>{item.ctaLabel || 'Saiba mais'} →</a>}
   </div>
  </article>)}</div>
  <ListStatus list={list} empty={banners ? 'Novos destaques serão publicados aqui.' : 'Nenhuma experiência publicada no momento.'} />
 </section>;
}
