import { ArrowRight, Check, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { planModalities } from "@/lib/api/plan-subscription.mjs"
import styles from "../ticket.module.css"

export default function PlansCatalog({ list, plans, billing, setBilling, modality, setModality, periodFor, startSubscription, pending }) {
  return (
      <section id="planos" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="text-center">
          <h2 className={`${styles.title} text-5xl font-black sm:text-6xl md:text-7xl`}>Compare os planos</h2>
          <div className="mx-auto mt-6 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">Modalidade
              <select className="min-h-11 rounded-lg border border-border bg-card px-3 font-normal" value={modality} onChange={event => setModality(event.target.value)} disabled={pending}>
                {planModalities.map(option => <option key={option.id} value={option.id}>{option.name} · {option.members} {option.members === 1 ? 'pessoa' : 'pessoas'}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">Período
              <select className="min-h-11 rounded-lg border border-border bg-card px-3 font-normal" value={billing} onChange={event => setBilling(event.target.value)} disabled={pending}>
                <option value="monthly">Mensal</option><option value="annual">Anual</option>
              </select>
            </label>
          </div>
        </div>

        {list.loading && <p className="mt-6" role="status">Carregando planos…</p>}
        {list.error && <div className="mt-6" role="alert"><p>{list.error}</p><Button variant="outline" onClick={list.retry}>Tentar novamente</Button></div>}
        {!list.loading && !list.error && !plans.length && <p className="mt-6">Nenhum plano publicado no momento.</p>}
        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <article key={plan.id} className={`${styles.ticket} flex h-full flex-col overflow-hidden ${plan.accent ? "ring-1 ring-primary" : ""}`}>
                <div className={`px-6 pb-6 pt-6 ${plan.accent ? "bg-primary/10" : ""}`}>
                  <div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></div>
                  <h3 className={`${styles.title} mt-5 text-3xl font-black`}>{plan.name}</h3>
                  <div className="mt-5 flex flex-wrap items-baseline gap-1"><span className={`${styles.title} text-5xl font-black tabular-nums`}>{plan.priceLabel}</span>{plan.available && <span className="text-xs text-muted-foreground">{periodFor}</span>}</div>
                </div>
                <div className={styles.tear} aria-hidden="true" />
                <div className={`${styles.stub} flex flex-1 flex-col p-6 pt-5`}>
                  <h4 className="mb-4 text-sm font-bold">Benefícios</h4>
                  <ul className="mb-7 flex-1 space-y-3">
                    {plan.benefitRows.map(({ label, included }) => <li key={label} className="flex items-start gap-2.5 text-sm leading-5">
                      {included ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> :
                        <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                      <span>{label}<span className={included ? "sr-only" : "block text-xs text-muted-foreground"}>{included ? " incluído" : "Indisponível"}</span></span>
                    </li>)}
                  </ul>
                  <Button disabled={pending || !plan.available} onClick={() => startSubscription(plan.id)} className="h-auto min-h-9 w-full whitespace-normal" variant={plan.accent ? "default" : "outline"}>{plan.available ? `Escolher ${plan.name}` : "Indisponível neste período"} <ArrowRight className="size-4 shrink-0" /></Button>
                </div>
              </article>
            )
          })}
        </div>
        {list.cursor && <Button className="mt-6" variant="outline" disabled={list.loading} onClick={list.loadMore}>Carregar mais planos</Button>}
      </section>
  )
}
