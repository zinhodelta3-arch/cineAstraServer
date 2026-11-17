import { ArrowRight, Clapperboard, Gift, Sparkles, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import styles from "../ticket.module.css"

export default function PlansHero({ showPlans }) {
  return (
      <section className="border-b border-border/70">
        <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-5 py-8 md:grid-cols-[1.1fr_.9fr] md:px-10 md:py-12">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase"><Sparkles className="size-4" /> Clube CineAstra</div>
            <h1 className={`${styles.title} text-[clamp(2.75rem,6vw,5.5rem)] font-black leading-[.95] tracking-tight`}>Mais cinema.<br />Mais vantagens.<br /><span className="text-primary">Mais Astra.</span></h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Escolha o plano do Clube CineAstra pelos benefícios que você quer usar.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={showPlans}>Comparar planos <ArrowRight className="size-4" /></Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className={`${styles.ticket} overflow-hidden`}>
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1100&q=85" alt="Poltronas de cinema em uma sala iluminada" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-5 text-white"><div className="text-[10px] font-bold tracking-[.25em] uppercase">Seu ingresso para</div><div className={`${styles.title} text-4xl font-black`}>mais histórias.</div></div>
              </div>
              <div className={styles.tear} aria-hidden="true" />
              <div className={`${styles.stub} p-5`}>
                <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold tracking-[.2em] text-primary uppercase">Clube CineAstra</div><div className="mt-1 text-lg font-black">Benefícios do clube</div></div><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Clapperboard className="size-5" /></div></div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[[ "Cinema", Ticket ], [ "Streaming", Clapperboard ], [ "AstraSnack", Gift ]].map(([label, Icon]) => <div key={label} className="px-1 py-2 text-center not-first:border-s not-first:border-dashed not-first:border-border"><Icon className="mx-auto size-4 text-primary" aria-hidden="true" /><div className="mt-2 text-[10px] font-bold">{label}</div></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}
