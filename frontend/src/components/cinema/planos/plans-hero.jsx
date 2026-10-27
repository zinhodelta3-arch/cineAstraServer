import { ArrowRight, CheckCircle2, Clapperboard, Gift, Sparkles, Ticket, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PlansHero({ showPlans, showSharing }) {
  return (
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_20%,hsl(var(--primary)/.22),transparent_50%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--card)))]" />
        <div className="absolute -right-24 top-12 -z-10 size-80 rounded-full border border-primary/20 md:size-[30rem]" />
        <div className="absolute -right-10 top-24 -z-10 size-60 rounded-full border border-dashed border-primary/30 md:size-[24rem]" />
        <div className="mx-auto grid min-h-[500px] max-w-[1600px] items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:px-10 md:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase"><Sparkles className="size-4" /> Clube CineAstra</div>
            <h1 className="f-display text-6xl font-black leading-[.9] tracking-tight sm:text-7xl md:text-8xl">Mais cinema.<br />Mais vantagens.<br /><span className="text-primary">Mais Astra.</span></h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Um só plano para aproveitar o cinema e o streaming. Escolha os benefícios que combinam com você — e compartilhe a experiência com quem quiser.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={showPlans}>Comparar planos <ArrowRight className="size-4" /></Button>
              <Button size="lg" variant="outline" onClick={showSharing}><Users className="size-4" /> Conhecer plano compartilhado</Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Cinema + streaming</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Benefícios mensais</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Cancele pelo sistema</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2rem] border border-dashed border-primary/30 rotate-3" />
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1100&q=85" alt="Poltronas de cinema em uma sala iluminada" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-5 text-white"><div className="text-[10px] font-bold tracking-[.25em] uppercase">Seu ingresso para</div><div className="f-display text-4xl font-black">mais histórias.</div></div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold tracking-[.2em] text-primary uppercase">Clube CineAstra</div><div className="mt-1 text-lg font-black">Uma assinatura. Dois universos.</div></div><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Clapperboard className="size-5" /></div></div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[[ "Cinema", Ticket ], [ "Streaming", Clapperboard ], [ "AstraSnack", Gift ]].map(([label, Icon]) => <div key={label} className="rounded-lg border border-border/70 bg-background p-3 text-center"><Icon className="mx-auto size-4 text-primary" /><div className="mt-2 text-[10px] font-bold">{label}</div></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}
