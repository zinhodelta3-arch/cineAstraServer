import { Star } from "lucide-react"
import { TESTIMONIALS } from "./data"

export default function ExperienceTestimonials() {
  return (
      <section className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><Star className="size-3.5" /> Experiências que conectam</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Momentos que<br />merecem replay<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Cada evento tem sua própria história. Queremos que a experiência seja planejada com cuidado, do primeiro contato até os créditos finais.</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Star className="size-4 fill-primary text-primary" /><span>Exemplos de depoimentos para demonstração do layout.</span></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((review) => (
              <article key={review.name} className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <div className="mb-4 flex gap-1 text-primary">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="size-3.5 fill-current" />)}</div>
                <p className="text-sm leading-6 text-foreground/85">“{review.quote}”</p>
                <div className="mt-5 border-t border-dashed border-border pt-4">
                  <div className="text-sm font-bold">{review.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{review.type}</div>
                  <div className="mt-3 inline-flex rounded-full border border-border px-2 py-1 text-[9px] font-bold tracking-wider text-muted-foreground uppercase">Depoimento ilustrativo</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
  )
}
