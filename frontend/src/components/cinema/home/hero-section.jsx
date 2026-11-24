"use client";

import { Film, Ticket, Clock3, ChevronLeft, ChevronRight, Sparkles, Play, Pause } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { Badge, SmartImg, Button } from "./home-ui";
import { useHomeHero } from "@/hooks/cinema/home/use-home-hero";
import TrailerButton from "./trailer-modal";
import ResponsiveFilmBanner from "../filmes/responsive-film-banner";

export default function HeroSection({ movies, onSelectMovie }) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const { cur, setCur, movie } = useHomeHero(movies, trailerOpen || !autoplay);
  if (!movie) return null;

  return (
    <section id="hero" aria-label="Filmes em destaque" className="grain relative flex min-h-[74svh] items-end overflow-hidden bg-background pt-30 lg:min-h-[82svh]">
      {movies.map((m, i) => (
        <div key={m.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-card to-background" />
          <ResponsiveFilmBanner filmId={m.id} context="CINEMA_HOME" cover={m.image} active={i === cur} />
          <div className="absolute inset-0 hero-scrim-x" />
          <div className="absolute inset-0 hero-scrim-y" />
          <div className="absolute inset-0 hero-tint" />
          <div aria-hidden="true" className="absolute inset-0 [background:linear-gradient(to_bottom,transparent_4%,color-mix(in_srgb,var(--background)_88%,transparent)_38%,var(--background)_99%)] lg:hidden" />
        </div>
      ))}
      <Image
        src="/Logominimalista.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={260}
        priority
        className="pointer-events-none absolute top-6 right-[1%] z-10 hidden h-auto w-28 opacity-19 md:block md:w-40"
      />

      <div className="perf absolute top-0 inset-x-0 z-20" aria-hidden="true" />
      {/* Fade inferior: o hero se dissolve suavemente no fundo da próxima seção */}
      <div className="hero-bottom-fade absolute bottom-0 inset-x-0 z-[15] pointer-events-none" aria-hidden="true" />

      <div className="relative z-20 mx-auto w-full max-w-[1600px] px-5 pb-12 md:px-8">
        <div className="grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Badge className="bg-primary/15 border border-primary/40 text-primary">
                <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> {movie.label ?? "No catálogo"}
              </Badge>

            </div>
            <p className="text-primary font-semibold text-sm mb-3 max-w-lg">{movie.subtitle}</p>
            <h1 className="f-display mb-5 max-w-[19ch] break-words text-[clamp(2.75rem,6.8vw,6rem)] font-black uppercase leading-[.94] text-foreground">{movie.title}</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">

              <span className="flex items-center"><Clock3 className="w-4 h-4 mr-1 opacity-70" aria-hidden="true" />{movie.duration}</span>
              <span>{movie.genre}</span>
              <span className="px-2 py-0.5 rounded border border-border text-[11px] font-bold">{movie.rating}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => onSelectMovie(movie)}><Ticket className="w-5 h-5 mr-2" aria-hidden="true" /> {movie.onSale ? "Consultar sessões" : "Ver detalhes"}</Button>
              <TrailerButton key={movie.id} url={movie.trailerUrl} title={movie.title} onOpenChange={setTrailerOpen} ticketStyle
                className="rounded-full border border-border px-8 py-4 font-bold focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
          </div>

          {movies.length > 1 && <div className="w-fit max-w-full rounded-lg border border-border bg-card/90 p-2.5">
            <div className="flex max-w-full flex-wrap gap-1.5">
              {movies.map((m, i) => (
                <button key={m.id} type="button" onClick={() => setCur(i)} aria-label={m.title} aria-pressed={i === cur}
                  className={`h-16 w-11 overflow-hidden rounded border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:transition-opacity sm:h-[4.75rem] sm:w-[3.5rem] ${i === cur ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <SmartImg src={m.poster} title={m.title} icon={Film} />
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-dashed border-border pt-2">
              <span className="ml-1 text-xs tabular-nums text-muted-foreground" aria-label={`Destaque ${cur + 1} de ${movies.length}`}>{cur + 1} / {movies.length}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" aria-label="Destaque anterior" onClick={() => setCur((p) => (p === 0 ? movies.length - 1 : p - 1))}><ChevronLeft className="size-5" aria-hidden="true" /></Button>
                <Button size="icon" variant="outline" aria-label={autoplay ? "Pausar rotação dos destaques" : "Iniciar rotação dos destaques"} onClick={() => setAutoplay(value => !value)}>{autoplay ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}</Button>
                <Button size="icon" variant="outline" aria-label="Próximo destaque" onClick={() => setCur((p) => (p + 1) % movies.length)}><ChevronRight className="size-5" aria-hidden="true" /></Button>
              </div>
            </div>
          </div>}
        </div>
      </div>
    </section>
  );
}
