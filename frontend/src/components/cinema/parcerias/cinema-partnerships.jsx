"use client";

import { useState } from "react";
import { ArrowRight, Handshake } from "lucide-react";
import Link from "next/link";
import LoadingImage from "@/components/ui/loading-image";
import ListStatus from "@/components/cinema/home/list-status";
import useCinemaPartnerships from "@/hooks/cinema/parcerias/use-cinema-partnerships";
import styles from "../ticket.module.css";

const choice = "min-h-11 min-w-0 rounded-md border border-border px-3 py-2 text-start text-sm transition-colors hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function CinemaPartnerships() {
  const { list, category, setCategory, categories, benefits } = useCinemaPartnerships();
  const [selectedId, setSelectedId] = useState(null);
  const selected = benefits.find(item => item.id === selectedId) ?? benefits[0];

  return (
    <main className="mx-auto min-h-[65svh] max-w-6xl px-5 py-10 text-foreground sm:px-8 sm:py-14">
      <header className="max-w-2xl border-b border-dashed border-border pb-5">
        <h1 className={`${styles.title} text-5xl font-bold sm:text-6xl`}>Parcerias</h1>
        <p className="mt-3 text-muted-foreground">Conheça os parceiros atuais e confira as condições de cada parceria.</p>
      </header>
      {categories.length > 1 && <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Categorias das parcerias">
        {[null, ...categories].map(item => <button type="button" key={item ?? "all"} className={choice} aria-pressed={category === item}
          onClick={() => { setCategory(item); setSelectedId(null); }}>{item ?? "Todas"}</button>)}
      </div>}
      {selected && <div className={`mt-6 grid min-w-0 items-start gap-5 ${benefits.length > 1 ? "md:grid-cols-[minmax(12rem,1fr)_minmax(0,2.6fr)]" : ""}`}>
        {benefits.length > 1 && <section aria-labelledby="partners-list-title" className="min-w-0">
          <h2 id="partners-list-title" className="mb-3 font-semibold">Parceiros atuais</h2>
          <ul className="flex flex-wrap gap-2 md:grid">
            {benefits.map(item => <li key={item.id} className="min-w-0">
              <button type="button" className={`${choice} w-full break-words`} aria-controls="partner-detail"
                aria-pressed={item.id === selected.id} onClick={() => setSelectedId(item.id)}>{item.title}</button>
            </li>)}
          </ul>
        </section>}
        <article id="partner-detail" aria-labelledby="active-partner-title" aria-live="polite"
          className={`${styles.ticket} min-w-0 overflow-hidden`}>
          {selected.image && <LoadingImage src={selected.image} alt={selected.imageAlt ?? ""} className="aspect-[2/1] max-h-64 w-full object-cover" />}
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {!selected.image && <Handshake size={28} className="mb-4 text-primary" aria-hidden="true" />}
            {selected.tag && <p className="mb-2 text-sm font-semibold text-primary">{selected.tag}</p>}
            <h2 id="active-partner-title" className={`${styles.title} break-words text-4xl font-bold sm:text-5xl`}>{selected.title}</h2>
            {selected.summary && <p className="mt-3 max-w-[65ch] whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">{selected.summary}</p>}
            {selected.description && <p className="mt-3 max-w-[65ch] whitespace-pre-wrap break-words leading-relaxed">{selected.description}</p>}
          </div>
          {selected.href && <>
            <div className={styles.tear} aria-hidden="true" />
            <div className={`${styles.stub} px-5 py-3 sm:px-8`}>
              <a href={selected.href} className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4"
                {...(selected.href.startsWith("https://") && { target: "_blank", rel: "noopener noreferrer" })}>
                {selected.ctaLabel || "Conhecer parceria"} <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </>}
        </article>
      </div>}
      <ListStatus list={list} empty="Nenhuma parceria publicada no momento." more="Carregar mais parcerias" />
      <Link href="/cinema/suporte" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Falar com o CineAstra</Link>
    </main>
  );
}
