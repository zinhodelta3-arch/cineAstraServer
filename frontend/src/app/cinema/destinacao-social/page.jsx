"use client";

import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
import ListStatus from "@/components/cinema/home/list-status";
import { usePublicList } from "@/hooks/cinema/home/use-public-list";
import { safeLink } from "@/lib/api/public-api.mjs";
import styles from "@/components/cinema/ticket.module.css";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const formatMonth = value => month.format(new Date(value + "-01T00:00:00Z"));

export default function SocialDestinationPage() {
  const current = usePublicList("/social-destinations?period=current&limit=1");
  const archive = usePublicList("/social-destinations?period=other&limit=12");
  const featured = current.items[0];

  return <main className="mx-auto min-h-[65svh] max-w-6xl px-5 py-10 text-foreground sm:px-8 sm:py-14">
    <header className="max-w-2xl border-b border-dashed border-border pb-5">
      <h1 className={`${styles.title} text-5xl font-bold sm:text-6xl`}>Destinação social</h1>
      <p className="mt-3 text-muted-foreground">Acompanhe as instituições apoiadas e confira como os valores de cada iniciativa são destinados.</p>
    </header>

    <section aria-labelledby="current-initiative" className="mt-8">
      <h2 id="current-initiative" className={`${styles.title} mb-4 text-3xl font-bold`}>Iniciativa do mês</h2>
      {featured ? <article className={`${styles.ticket} overflow-hidden`}>
        <div className="grid min-w-0 gap-5 px-5 py-6 sm:px-8 sm:py-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold capitalize text-primary">
              <Leaf size={17} aria-hidden="true" /> {formatMonth(featured.month)}
            </p>
            <h3 className={`${styles.title} break-words text-4xl font-bold sm:text-5xl`}>{featured.institution}</h3>
            {featured.description && <p className="mt-3 max-w-[65ch] whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">{featured.description}</p>}
          </div>
          {featured.amount != null && <div className="self-end border-t border-dashed border-border pt-4 md:border-s md:border-t-0 md:ps-6 md:pt-0">
            <p className="text-sm text-muted-foreground">{featured.simulated ? "Valor apurado na simulação" : "Valor apurado"}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary">{money.format(Number(featured.amount))}</p>
          </div>}
        </div>
        <div className={styles.tear} aria-hidden="true" />
        <div className={`${styles.stub} px-5 py-5 sm:px-8`}>
          <InitiativeDetails item={featured} showDescription={false} />
        </div>
      </article> : <ListStatus list={current} empty="Nenhuma iniciativa publicada para este mês." showMore={false} />}
    </section>

    <section aria-labelledby="other-initiatives" className="mt-10">
      <h2 id="other-initiatives" className={`${styles.title} mb-4 text-3xl font-bold`}>Outras iniciativas</h2>
      <div className="space-y-3">
        {archive.items.map(item => <details key={item.id} className="min-w-0 rounded-md border border-border bg-card">
          <summary className="cursor-pointer rounded-md px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5">
            <span className="ms-2 break-words font-semibold">{item.institution}</span>
            <span className="ms-2 text-sm capitalize text-muted-foreground">{formatMonth(item.month)}</span>
          </summary>
          <div className="border-t border-dashed border-border px-4 py-4 sm:px-5">
            <InitiativeDetails item={item} />
            {item.amount != null && <p className="mt-3 text-sm"><strong>{money.format(Number(item.amount))}</strong> {item.simulated ? "apurados na simulação" : "apurados nas compras elegíveis"}</p>}
          </div>
        </details>)}
      </div>
      <ListStatus list={archive} empty="Nenhuma outra iniciativa publicada." more="Carregar mais iniciativas" />
    </section>
    <Link href="/cinema/sobre-nos" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Sobre o CineAstra</Link>
  </main>;
}

function InitiativeDetails({ item, showDescription = true }) {
  const proof = safeLink(item.proofUrl);
  return <div className="space-y-2">
    {item.simulated && <p className="text-sm font-semibold text-primary">Ambiente simulado</p>}
    {item.category && <p className="text-sm font-semibold">{item.category}</p>}
    {showDescription && item.description && <p className="whitespace-pre-wrap break-words text-muted-foreground">{item.description}</p>}
    {item.purpose && <p className="whitespace-pre-wrap break-words"><strong>Finalidade</strong><br />{item.purpose}</p>}
    {proof && <a href={proof} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">
      Consultar comprovação <ArrowUpRight size={15} aria-hidden="true" />
    </a>}
  </div>;
}
