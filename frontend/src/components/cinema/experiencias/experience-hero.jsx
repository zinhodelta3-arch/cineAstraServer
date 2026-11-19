import LoadingImage from "@/components/ui/loading-image";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { U } from "./data"
import styles from "../ticket.module.css"

export default function ExperienceHero() {
  return (
      <section className="mx-auto max-w-[1600px] px-5 py-6 md:px-10 md:py-10">
        <div className={`${styles.ticket} overflow-hidden`}>
          <div className="grid lg:grid-cols-[1fr_.85fr]">
            <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
              <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase">
                <Sparkles className="size-4" aria-hidden="true" /> Experiências CineAstra
              </div>
              <h1 className={`${styles.title} text-[clamp(2.75rem,6vw,5.5rem)] font-black leading-[.95] tracking-tight`}>
                O cinema vai muito <span className="text-primary">além</span> da sessão.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
                Uma sala inteira só para vocês, filmes sob as estrelas ou a nostalgia do drive-in.
                Escolha o formato e vamos planejar uma experiência que tem tudo a ver com seu evento.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a className={buttonVariants({ size: "lg", className: "min-h-11" })} href="#experiencias">
                  Conhecer as opções <ChevronRight className="size-4" />
                </a>
              </div>
            </div>
            <div className="relative h-44 sm:h-56 lg:h-auto lg:border-s lg:border-dashed lg:border-border">
              <LoadingImage
                src={U("photo-1485846234645-a62644f84728", 1200, 850)}
                alt="Claquete de filmagem em uma paisagem ao ar livre"
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
              />
            </div>
          </div>
          <div className={styles.tear} aria-hidden="true" />
          <div className={`${styles.stub} flex flex-wrap gap-x-6 gap-y-3 px-5 py-4 text-xs font-semibold text-muted-foreground sm:px-8 lg:px-12`}>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Para grupos e empresas</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Formatos personalizados</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Orçamento sob consulta</span>
          </div>
        </div>
      </section>
  )
}
