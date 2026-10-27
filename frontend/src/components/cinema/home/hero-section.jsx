"use client";

import { Film, Ticket, Clock3, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { Badge, SmartImg, Button } from "./home-ui";
import { useHomeHero } from "@/hooks/cinema/home/use-home-hero";

export default function HeroSection({ movies, onSelectMovie }) {
  const { cur, setCur, movie } = useHomeHero(movies);
  if (!movie) return null;

  return (
    <section id="hero" className="grain relative min-h-[88vh] lg:min-h-[94vh] bg-background flex items-end pt-12 overflow-hidden">
      {movies.map((m, i) => (
        <div key={m.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-card to-background" />
          <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${m.image})`, backgroundPosition: "72% center" }} />
          <div className="absolute inset-0 hero-scrim-x" />
          <div className="absolute inset-0 hero-scrim-y" />
          <div className="absolute inset-0 hero-tint" />
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

      <div className="relative z-20 max-w-[1600px] mx-auto px-5 md:px-8 pb-20 pt-12 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Badge className="bg-primary/15 border border-primary/40 text-primary">
                <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> No catálogo
              </Badge>

            </div>
            <p className="text-primary font-semibold text-sm mb-3 max-w-lg">{movie.subtitle}</p>
            <h1 className="f-display text-5xl sm:text-7xl lg:text-[7rem] font-black text-foreground uppercase leading-[0.85] mb-6">{movie.title}</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">

              <span className="flex items-center"><Clock3 className="w-4 h-4 mr-1 opacity-70" aria-hidden="true" />{movie.duration}</span>
              <span>{movie.genre}</span>
              <span className="px-2 py-0.5 rounded border border-border text-[11px] font-bold">{movie.rating}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => onSelectMovie(movie)}><Ticket className="w-5 h-5 mr-2" aria-hidden="true" /> Consultar sessões</Button>
              {movie.trailerUrl && <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-8 py-4 font-bold focus-visible:ring-2 focus-visible:ring-primary">Assistir trailer ↗</a>}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-start lg:items-end">
            <div className="flex items-center gap-3 mb-5">
              <Button size="icon" variant="outline" aria-label="Anterior" onClick={() => setCur((p) => (p === 0 ? movies.length - 1 : p - 1))}><ChevronLeft className="w-6 h-6" /></Button>
              <Button size="icon" variant="outline" aria-label="Próximo" onClick={() => setCur((p) => (p + 1) % movies.length)}><ChevronRight className="w-6 h-6" /></Button>
            </div>
            <div className="flex gap-2 bg-card/80 backdrop-blur-md border border-border p-2 rounded-md">
              {movies.map((m, i) => (
                <button key={m.id} type="button" onClick={() => setCur(i)} aria-label={m.title}
                  className={`w-20 h-28 overflow-hidden rounded-sm border-2 transition-all ${i === cur ? "border-primary shadow-lg shadow-primary/30" : "border-transparent opacity-50 hover:opacity-100"}`}>
                  <SmartImg src={m.poster} title={m.title} icon={Film} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
