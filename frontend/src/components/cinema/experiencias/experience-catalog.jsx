import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { venueTypes, eventSeatingLabels } from "@/lib/api/cinema-locations.mjs"

export default function ExperienceCatalog({ chooseExperience, experiences, list }) {
  return (
      <section id="experiencias" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><span className="h-px w-7 bg-primary" /> Escolha seu formato</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl md:text-7xl">Experiências<br className="sm:hidden" /> extraordinárias<span className="text-primary">.</span></h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">De uma comemoração intimista a um evento para muita gente: encontre o cenário perfeito para sua próxima história.</p>
        </div>

        {list.loading && <p role="status">Carregando experiências…</p>}
        {list.error && <div role="alert"><p>{list.error}</p><Button variant="outline" onClick={list.retry}>Tentar novamente</Button></div>}
        {!list.loading && !list.error && !experiences.length && <p>Nenhuma experiência publicada no momento.</p>}
        <div className="grid gap-5 lg:grid-cols-3">
          {experiences.map((experience) => {
            return (
              <article key={experience.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
                {experience.imageUrl && <div className="relative aspect-[5/3] overflow-hidden bg-muted">
                  <img src={experience.imageUrl} alt={experience.imageAlt ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>}
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  {experience.tag && <div className="text-xs font-bold text-primary">{experience.tag}</div>}
                  <h3 className="f-display mt-2 text-3xl font-black leading-none sm:text-4xl">{experience.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{experience.summary}</p>
                  {experience.location && <p className="mt-3 text-sm text-muted-foreground">
                    {[experience.location.name,venueTypes[experience.location.type],
                      experience.location.eventCapacity && `Até ${experience.location.eventCapacity.toLocaleString("pt-BR")} pessoas`,
                      eventSeatingLabels[experience.location.eventSeating]].filter(Boolean).join(" · ")}
                  </p>}
                  {experience.priceLabel && <div className="my-5 border-y border-dashed border-border/80 py-4">
                    <div className="text-[10px] font-bold tracking-[.2em] text-muted-foreground uppercase">Valores a partir de</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="f-display text-4xl font-black text-primary">{experience.priceLabel}</span>
                      <span className="text-[10px] text-muted-foreground">{experience.unit}</span>
                    </div>
                  </div>}
                  <div className="my-5 space-y-2">
                    {experience.details.map((detail) => <div key={detail} className="flex items-start gap-2 text-xs text-foreground/80"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>{detail}</span></div>)}
                  </div>
                  <div className="mt-auto grid gap-2">
                    {experience.description && <details className="mb-2 text-sm"><summary className="cursor-pointer font-semibold">Saber mais</summary><p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{experience.description}</p></details>}
                    <Button onClick={() => chooseExperience(experience.id)}>Solicitar orçamento <ArrowRight className="size-4" /></Button>
                    {experience.targetUrl && <Button variant="outline" nativeButton={false} render={<Link href={experience.targetUrl} />}>{experience.ctaLabel ?? "Ver página da experiência"}</Button>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {list.cursor && <Button className="mt-5" variant="outline" disabled={list.loading} onClick={list.loadMore}>Carregar mais experiências</Button>}
      </section>
  )
}
