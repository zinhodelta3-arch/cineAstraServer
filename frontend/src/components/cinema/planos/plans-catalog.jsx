import ListStatus from "@/components/cinema/home/list-status"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PlansCatalog({ list, plans, billing, setBilling, periodFor, startSubscription, pending }) {
  return (
      <section id="planos" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="text-center">
          <div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Encontre seu plano</div>
          <h2 className="f-display text-5xl font-black sm:text-6xl md:text-7xl">Escolha como viver o cinema<span className="text-primary">.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">Compare os preços e benefícios publicados e confira as condições antes de contratar.</p>
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5">
            <button disabled={pending} type="button" onClick={() => setBilling("monthly")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Mensal</button>
            <button disabled={pending} type="button" onClick={() => setBilling("annual")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${billing === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Anual</button>
          </div>
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <article key={plan.id} className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/70 transition-all duration-300 hover:-translate-y-1 ${plan.accent ? "border-primary shadow-xl shadow-primary/10 lg:scale-[1.025]" : "border-border/70"}`}>
                <div className={`px-6 pb-6 pt-6 ${plan.accent ? "bg-primary/10" : ""}`}>
                  <div className="flex items-center justify-between gap-3"><div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5" /></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black tracking-wider uppercase ${plan.accent ? "border-primary/30 bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{plan.badge}</span></div>
                  <h3 className="f-display mt-5 text-3xl font-black">{plan.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1"><span className="f-display text-5xl font-black">{plan.priceLabel}</span><span className="text-xs text-muted-foreground">{periodFor}</span></div>

                </div>
                <div className="mx-6 border-t border-dashed border-border" />
                <div className="flex flex-1 flex-col p-6 pt-5">
                  <div className="mb-4 text-[10px] font-black tracking-[.2em] text-muted-foreground uppercase">O que está incluído</div>
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2.5 text-sm leading-5"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{benefit}</span></li>)}
                  </ul>
                  <Button disabled={pending} onClick={() => startSubscription(plan.id)} className="mt-7 w-full" variant={plan.accent ? "default" : "outline"}>Escolher {plan.name} <ArrowRight className="size-4" /></Button>
                </div>
              </article>
            )
          })}
        </div>
        <ListStatus list={list} empty="Nenhum plano publicado no momento." />
      </section>
  )
}
