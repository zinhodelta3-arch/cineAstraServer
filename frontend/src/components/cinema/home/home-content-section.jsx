"use client";
import { ArrowRight, Film } from 'lucide-react';
import Link from 'next/link';
import { useHomeContent } from '@/hooks/cinema/home/use-home-content';
import { SmartImg, SectionTitle } from './home-ui';
import ListStatus from './list-status';
import ExperienceImage from '../experiencias/experience-image';
import styles from './home-content-section.module.css';

function ExperienceTicket({ item }) {
 return <article className={`relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card ${styles.ticket}`}>
  <div className={styles.film} aria-hidden="true" />
  <ExperienceImage key={item.imageUrl} src={item.imageUrl} alt={item.imageAlt} className="aspect-video w-full" />
  <div className="flex flex-1 flex-col gap-2 px-5 pt-5 pb-6">
   {item.tag ? <span className="text-sm font-semibold text-primary">{item.tag}</span> : (
    <span className="hidden min-h-5 md:block" aria-hidden="true" />
   )}
   <h3 className="f-display text-3xl leading-tight font-bold">{item.title}</h3>
   <p className="text-muted-foreground">{item.summary?.trim() || item.description}</p>
   {item.priceLabel && <p>{item.priceLabel} {item.unit}</p>}
  </div>
  <div className={`flex items-center justify-between gap-3 px-5 ${styles.stub}`}>
   <Link className="inline-flex min-h-11 items-center gap-2 rounded-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring after:absolute after:inset-0"
    href={`/cinema/experiencias/${encodeURIComponent(item.id)}`} aria-label={`Ver detalhes de ${item.title}`}>
    Ver detalhes <ArrowRight className="size-4" aria-hidden="true" />
   </Link>
   <span className={styles.barcode} aria-hidden="true" />
  </div>
 </article>;
}

export default function HomeContentSection({ kind = 'experiences', placement }) {
 const list = useHomeContent(kind, placement), banners = kind === 'banners';
 if (banners && !list.items.length) return null;
 return <section className="max-w-[1600px] mx-auto px-5 md:px-8 py-16" aria-label={banners ? 'Destaques' : 'Experiências'}>
  {banners ? <SectionTitle eyebrow="CineAstra" title="Campanhas" /> : (
   <div className="mb-8 flex gap-4">
    <div className="perf-v self-stretch rounded-sm" aria-hidden="true" />
    <h2 className="f-display text-5xl leading-none font-black md:text-7xl">Experiências</h2>
   </div>
  )}
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{list.items.map(item => banners ? <article key={item.id} className="relative overflow-hidden rounded-xl border border-border bg-card motion-safe:transition-colors hover:border-primary/50 focus-within:border-primary">
   {item.imageUrl && <div className="aspect-video"><SmartImg src={item.imageUrl} alt={item.imageAlt || item.title} title={item.title} icon={Film} /></div>}
   <div className="p-6 space-y-3">{item.tag && <span className="text-sm text-primary">{item.tag}</span>}<h3 className="f-display text-3xl font-bold">{item.title}</h3><p className="text-muted-foreground">{item.summary}</p>
    {item.priceLabel && <p>{item.priceLabel} {item.unit}</p>}
    {item.targetUrl && <a className="inline-block rounded-full border border-primary px-5 py-2 font-semibold text-primary focus-visible:ring-2" href={item.targetUrl}>{item.ctaLabel || 'Saiba mais'} →</a>}
   </div>
  </article> : <ExperienceTicket key={item.id} item={item} />)}</div>
  <ListStatus list={list} empty={banners ? 'Novos destaques serão publicados aqui.' : 'Nenhuma experiência publicada no momento.'} />
 </section>;
}
