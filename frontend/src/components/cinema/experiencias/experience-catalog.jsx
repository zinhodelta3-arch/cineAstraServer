import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EXPERIENCES } from "./data"

export default function ExperienceCatalog({ chooseExperience }) {
  return (
      <section id="experiencias" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><span className="h-px w-7 bg-primary" /> Escolha seu formato</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl md:text-7xl">Experiências<br className="sm:hidden" /> extraordinárias<span className="text-primary">.</span></h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">De uma comemoração intimista a um evento para muita gente: encontre o cenário perfeito para sua próxima história.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {EXPERIENCES.map((experience) => {
            const Icon = experience.icon
            return (
              <article key={experience.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
                <div className="relative aspect-[5/3] overflow-hidden bg-muted">
                  <img src={experience.image} alt={experience.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    <Icon className="size-3.5" /> {experience.tag}
                  </div>
                  <span className="f-display absolute right-4 bottom-2 text-6xl font-black text-white/60">{experience.number}</span>
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <div className="text-[10px] font-black tracking-[.22em] text-primary uppercase">{experience.eyebrow}</div>
                  <h3 className="f-display mt-2 text-3xl font-black leading-none sm:text-4xl">{experience.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{experience.short}</p>
                  <div className="my-5 border-y border-dashed border-border/80 py-4">
                    <div className="text-[10px] font-bold tracking-[.2em] text-muted-foreground uppercase">Valores a partir de</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="f-display text-4xl font-black text-primary">{experience.price}</span>
                      <span className="text-[10px] text-muted-foreground">{experience.unit}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Estimativa ilustrativa. O valor final depende de data, duração, local, estrutura e quantidade de pessoas.</p>
                  </div>
                  <div className="mb-5 space-y-2">
                    {experience.details.map((detail) => <div key={detail} className="flex items-start gap-2 text-xs text-foreground/80"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>{detail}</span></div>)}
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button onClick={() => chooseExperience(experience.id)} className="w-full">Reservar <ArrowRight className="size-4" /></Button>
                    <Button variant="outline" onClick={() => chooseExperience(experience.id)} className="w-full">Saber mais</Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
  )
}
