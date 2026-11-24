import ExperienceImage from "./experience-image";
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { venueTypes, eventSeatingLabels } from "@/lib/api/cinema-locations.mjs"
import styles from "../ticket.module.css"

export default function ExperienceCatalog({ experiences, list }) {
  return (
      <section id="experiencias" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><span className="h-px w-7 bg-primary" /> Escolha seu formato</div>
            <h2 className={`${styles.title} text-5xl font-black leading-none sm:text-6xl md:text-7xl`}>Experiências<br className="sm:hidden" /> extraordinárias<span className="text-primary">.</span></h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">De uma comemoração intimista a um evento para muita gente: encontre o cenário perfeito para sua próxima história.</p>
        </div>

        {list.loading && <p role="status">Carregando experiências…</p>}
        {list.error && <div role="alert"><p>{list.error}</p><Button variant="outline" onClick={list.retry}>Tentar novamente</Button></div>}
        {!list.loading && !list.error && !experiences.length && <p>Nenhuma experiência publicada no momento.</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience) => {
            return (
              <article key={experience.id} id={`experiencia-${experience.id}`} tabIndex={-1} className={`${styles.ticket} group flex h-full scroll-mt-28 flex-col overflow-hidden motion-safe:transition-colors hover:border-primary/50 target:border-primary`}>
                <ExperienceImage key={experience.imageUrl} src={experience.imageUrl} alt={experience.imageAlt} className="aspect-[5/3] w-full object-[center_55%]" />
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  {experience.tag && <div className="text-xs font-bold text-primary">{experience.tag}</div>}
                  <h3 className={`${styles.title} mt-2 text-3xl font-black leading-none sm:text-4xl`}>{experience.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{experience.summary?.trim() || experience.description}</p>
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
                </div>
                <div className={styles.tear} aria-hidden="true" />
                <div className={`${styles.stub} grid gap-2 px-5 py-4 md:px-6`}>
                  <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href={`/cinema/experiencias/${experience.id}`} aria-label={`Ver detalhes de ${experience.title}`}>Ver detalhes</Link>
                  <Link className={buttonVariants({ className: "min-h-11" })} href={`/cinema/experiencias/solicitar?experiencia=${experience.id}`} aria-label={`Solicitar orçamento para ${experience.title}`}>Solicitar orçamento <ArrowRight className="size-4" aria-hidden="true" /></Link>
                  {experience.targetUrl && <Button variant="outline" nativeButton={false} render={<Link href={experience.targetUrl} />}>{experience.ctaLabel ?? "Ver página da experiência"}</Button>}
                </div>
              </article>
            )
          })}
        </div>
        {list.cursor && <Button className="mt-5" variant="outline" disabled={list.loading} onClick={list.loadMore}>Carregar mais experiências</Button>}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-dashed border-border pt-6 sm:flex-row sm:items-center">
          <div>
            <h3 className={`${styles.title} text-3xl font-bold`}>Espaço personalizado</h3>
            <p className="mt-1 text-sm text-muted-foreground">Descreva o espaço e a estrutura que você tem em mente para o evento.</p>
          </div>
          <Link className={buttonVariants({ className: "min-h-11" })} href="/cinema/experiencias/solicitar?experiencia=personalizado">Solicitar espaço personalizado <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </section>
  )
}
