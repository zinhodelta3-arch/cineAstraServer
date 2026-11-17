"use client";

import Link from "next/link";
import useCinemaPartnerships from "@/hooks/cinema/parcerias/use-cinema-partnerships";

export default function CinemaPartnerships() {
  const { list, category, setCategory, categories, benefits } = useCinemaPartnerships();
  return <main className="mx-auto min-h-[65svh] max-w-6xl px-5 py-12 text-foreground sm:px-8">
    <h1 className="f-display text-5xl font-black sm:text-6xl">Parcerias</h1>
    <p className="mt-3 text-muted-foreground">Consulte as parcerias e condições publicadas pelo CineAstra.</p>
    {categories.length > 0 && <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Categorias das parcerias">
      {[null, ...categories].map(item => <button type="button" key={item ?? "all"} aria-pressed={category === item} onClick={() => setCategory(item)}
        className="min-h-11 rounded-full border border-border px-4 text-sm aria-pressed:border-primary aria-pressed:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{item ?? "Todas"}</button>)}
    </div>}
    {list.error && <div role="alert" className="mt-5"><p>{list.error}</p><button type="button" className="mt-2 text-primary underline" onClick={list.retry}>Tentar novamente</button></div>}
    {list.loading && <p role="status" className="mt-5">Carregando parcerias…</p>}
    {!list.loading && !list.error && !benefits.length && <p className="mt-6 text-muted-foreground">{category ? "Nenhuma parceria nesta categoria." : "Nenhuma parceria publicada no momento."}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {benefits.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
        {item.image && <img src={item.image} alt={item.imageAlt ?? ""} loading="lazy" className="aspect-video w-full object-cover" />}
        <div className="space-y-3 p-5">
          {item.tag && <p className="text-sm text-primary">{item.tag}</p>}
          <h2 className="text-2xl font-bold">{item.title}</h2>
          <p className="whitespace-pre-wrap break-words text-muted-foreground">{item.summary}</p>
          {item.description && <details><summary className="min-h-10 cursor-pointer text-sm font-semibold">Ver condições</summary><p className="whitespace-pre-wrap break-words">{item.description}</p></details>}
          {item.href && <a href={item.href} className="inline-flex min-h-11 items-center text-primary underline" {...(item.href.startsWith("https://") && { target: "_blank", rel: "noopener noreferrer" })}>{item.ctaLabel || "Conhecer parceria"}</a>}
        </div>
      </article>)}
    </div>
    {list.cursor && <button type="button" className="mt-5 min-h-11 text-primary underline" disabled={list.loading} onClick={list.loadMore}>Carregar mais parcerias</button>}
    <Link href="/cinema/suporte" className="mt-6 inline-flex min-h-11 items-center text-primary underline">Falar com o CineAstra</Link>
  </main>;
}
