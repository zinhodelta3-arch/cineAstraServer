import { ArrowDownRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { U } from "./data"

export default function ExperienceHero({ showExperiences }) {
  return (
      <section className="relative isolate min-h-[590px] overflow-hidden border-b border-border/70 bg-background md:min-h-[690px]">
        <img
          src={U("photo-1485846234645-a62644f84728", 2200, 1300)}
          alt="Tela de cinema iluminada em uma sala escura"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/20" />
        <div className="absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(90deg,var(--primary)_0_12px,transparent_12px_26px)] opacity-70" />
        <div className="mx-auto flex min-h-[590px] max-w-[1600px] items-end px-5 pb-14 pt-24 md:min-h-[690px] md:px-10 md:pb-20">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase">
              <Sparkles className="size-4" /> CineAstra • Experiências
            </div>
            <h1 className="f-display text-6xl font-black leading-[.9] tracking-tight sm:text-7xl md:text-8xl">
              O cinema vai<br />muito <span className="text-primary">além</span><br />da sessão.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
              Conheça as experiências publicadas pela CineAstra, confira os detalhes e solicite informações ao suporte para planejar seu evento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={showExperiences}>
                Planejar minha experiência <ArrowDownRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={showExperiences}>
                Conhecer as opções <ChevronRight className="size-4" />
              </Button>
            </div>

          </div>
        </div>
      </section>
  )
}
