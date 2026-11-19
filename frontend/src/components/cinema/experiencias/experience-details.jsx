'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import LoadingImage from '@/components/ui/loading-image';
import { useExperienceDetails } from '@/hooks/cinema/experiencias/use-cinema-experiences';
import { venueTypes, eventSeatingLabels } from '@/lib/api/cinema-locations.mjs';
import styles from '../ticket.module.css';

export default function ExperienceDetails({ id }) {
  const { item, loading, error, retry } = useExperienceDetails(id);
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <Link href="/cinema/experiencias#experiencias" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Experiências
      </Link>
      {loading && <p role="status">Carregando experiência…</p>}
      {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={retry} className="mt-3">Tentar novamente</Button></div>}
      {item && <article className={`${styles.ticket} overflow-hidden`}>
        {item.imageUrl && <LoadingImage src={item.imageUrl} alt={item.imageAlt} fetchPriority="high" className="block aspect-[16/9] max-h-[30rem] w-full bg-muted object-cover object-[center_65%] sm:aspect-[2/1]" />}
        <header className="px-5 py-7 sm:px-9 sm:py-9">
          <h1 className={`${styles.title} text-4xl font-bold leading-none sm:text-6xl`}>{item.title}</h1>
          {item.summary && <p className="mt-3 max-w-[65ch] leading-relaxed text-muted-foreground">{item.summary}</p>}
          {item.location && <p className="mt-4 text-sm">
            {[item.location.name, venueTypes[item.location.type], item.location.eventCapacity &&
              `Até ${item.location.eventCapacity.toLocaleString('pt-BR')} pessoas`, eventSeatingLabels[item.location.eventSeating]].filter(Boolean).join(' · ')}
          </p>}
          {item.priceLabel && <p className="mt-4 text-sm">A partir de <strong className="text-primary">{item.priceLabel}</strong> {item.unit}</p>}
          <Link className={buttonVariants({ className: 'mt-6 min-h-11 px-4' })} href={`/cinema/experiencias/solicitar?experiencia=${id}`}>
            Solicitar orçamento <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>
        {(item.description || item.details.length > 0) && <>
          <div className={styles.tear} aria-hidden="true" />
          <section className={`${styles.stub} px-5 py-6 sm:px-9 sm:py-8`} aria-labelledby="about-experience">
            <h2 id="about-experience" className={`${styles.title} text-2xl font-bold`}>Sobre a experiência</h2>
            {item.description && <p className="mt-3 max-w-[65ch] whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">{item.description}</p>}
            {item.details.length > 0 && <ul className="mt-4 grid gap-2 text-sm">{item.details.map(detail =>
              <li key={detail} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{detail}</li>
            )}</ul>}
          </section>
        </>}
      </article>}
    </main>
  );
}
