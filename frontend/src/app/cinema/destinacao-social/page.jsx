"use client";

import Link from "next/link";
import { CircleCheck, Leaf } from "lucide-react";
import { usePublicList } from "@/hooks/cinema/home/use-public-list";
import { safeLink } from "@/lib/api/public-api.mjs";

const money = value => Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const month = value => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value + "-01T00:00:00Z"));

export default function SocialDestinationPage() {
  const list = usePublicList("/social-destinations?limit=12");
  return <main className="mx-auto min-h-[65svh] max-w-5xl px-5 py-12 text-foreground sm:px-8">
    <h1 className="f-display text-5xl font-black sm:text-6xl">Destinação social</h1>
    <p className="mt-4 max-w-2xl text-muted-foreground">Consulte as iniciativas publicadas, quem recebe a destinação e as comprovações disponíveis.</p>
    {list.loading && !list.items.length && <p role="status" className="mt-8">Consultando iniciativas…</p>}
    {list.error && <div role="alert" className="mt-8"><p>{list.error}</p><button type="button" className="min-h-11 text-primary underline" onClick={list.retry}>Tentar novamente</button></div>}
    {!list.loading && !list.error && !list.items.length && <div className="mt-8 flex gap-3 rounded-xl border border-border bg-card p-5">
      <Leaf className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div><h2 className="font-bold">Nenhuma iniciativa publicada</h2><p className="mt-1 text-sm text-muted-foreground">Quando uma iniciativa for publicada, os detalhes estarão nesta página.</p></div>
    </div>}
    <div className="mt-8 space-y-4">
      {list.items.map(item => {
        const proof = safeLink(item.proofUrl);
        return <article key={item.id} className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-semibold capitalize">{month(item.month)}</span>
            {item.simulated && <span className="rounded-full border border-border px-2 py-1">Simulação</span>}
            {item.active && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900 px-2 py-1 font-semibold text-white"><CircleCheck size={14} aria-hidden="true" />Iniciativa do mês</span>}
          </div>
          <h2 className="mt-3 text-2xl font-bold">{item.institution}</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{item.description}</p>
          <p className="mt-2 whitespace-pre-wrap break-words">{item.purpose}</p>
          {item.amount != null && <p className="mt-3"><strong>{money(item.amount)}</strong> {item.simulated ? "apurados na simulação" : "apurados nas compras elegíveis"}</p>}
          {proof && <a href={proof} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-primary underline">Consultar comprovação</a>}
        </article>;
      })}
    </div>
    {list.cursor && <button type="button" disabled={list.loading} onClick={list.loadMore} className="mt-5 min-h-11 text-primary underline">Carregar mais iniciativas</button>}
    <Link href="/cinema/sobre-nos" className="mt-6 inline-flex min-h-11 items-center text-primary underline">Sobre o CineAstra</Link>
  </main>;
}
