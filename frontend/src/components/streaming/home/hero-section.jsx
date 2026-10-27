import useStreamHero from "@/hooks/streaming/home/use-stream-hero";
import Image from "next/image";
import { Play, Plus, BookmarkCheck, Info } from "lucide-react";
import { ACCENT, HERO_FILMS } from "./data";
import Art from "./art";
import Button from "./button";
import HeroArrow from "./hero-arrow";

export default function HeroSection({ onPlay, onSelect, myList, onToggleList }) {
  const { cur, setCur, go, movie, inList } = useStreamHero(myList);

  return (
    <section id="hero" aria-roledescription="carrossel" className="grain relative min-h-[90vh] bg-background flex items-center pt-28 pb-40 overflow-hidden">
      {HERO_FILMS.map((m, i) => (
        <div key={m.id} aria-hidden={i !== cur} className={`absolute inset-y-0 right-0 w-full lg:w-[78%] transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <Art movie={m} variant="backdrop" className="absolute inset-0 size-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 z-10 bg-linear-to-r from-background via-background/85 to-transparent" />
      <div className="absolute inset-0 z-10 bg-linear-to-t from-background via-transparent to-background/60" />

      <Image
        src="/Logominimalista.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={260}
        priority
        className="pointer-events-none absolute top-24 right-[2%] z-10 hidden h-auto w-28 opacity-20 md:block md:w-36"
      />

      <div className="perf absolute top-0 inset-x-0 z-20" aria-hidden="true" />

      <HeroArrow dir="prev" onClick={() => go(-1)} />
      <HeroArrow dir="next" onClick={() => go(1)} />

      <div className="relative z-20 max-w-[1800px] mx-auto px-5 md:px-12 w-full">
        <div className="max-w-2xl" aria-live="polite">
          <div className="f-display text-xl tracking-[0.2em] text-foreground/90 mb-1">
            <span className={`${ACCENT} font-black`}>CINEASTRA</span> ORIGINAL
          </div>
          <h1 className="f-display text-6xl sm:text-7xl lg:text-[8rem] font-black text-foreground uppercase leading-[0.85] mb-5">{movie.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-5 flex-wrap">
            <span className={`font-bold ${ACCENT}`}>{movie.match}% relevante</span>
            <span>{movie.year}</span>
            <span>{movie.duration}</span>
            <span className="px-1.5 py-0.5 rounded-xs border border-muted-foreground/60 text-[11px] font-bold">4K Ultra HD</span>
            <span className="px-1.5 py-0.5 rounded-xs border border-muted-foreground/60 text-[11px] font-bold">5.1</span>
          </div>
          <p className="text-base md:text-lg text-foreground/80 max-w-xl mb-5 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
          <p className="text-sm italic text-muted-foreground mb-8">
            {movie.cast}<br />Filmes · {movie.genre}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => onPlay(movie)}><Play className="size-5 mr-2 fill-current" aria-hidden="true" /> Assistir</Button>
            <Button size="lg" variant="outline" onClick={() => onToggleList(movie)}>
              {inList ? <BookmarkCheck className="size-5 mr-2" aria-hidden="true" /> : <Plus className="size-5 mr-2" aria-hidden="true" />}
              {inList ? "Na minha lista" : "Minha lista"}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => onSelect(movie)}><Info className="size-5 mr-2" aria-hidden="true" /> Mais informações</Button>
          </div>
        </div>
      </div>

      <div className="absolute z-20 bottom-40 right-0 flex items-center gap-4">
        <div className="flex gap-2">
          {HERO_FILMS.map((m, i) => (
            <button key={m.id} type="button" aria-label={`Ir para ${m.title}`} aria-current={i === cur} onClick={() => setCur(i)} className={`h-1.5 rounded-full transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${i === cur ? "w-8 bg-primary" : "w-4 bg-foreground/30 hover:bg-foreground/60"}`} />
          ))}
        </div>
        <div className="bg-background/60 border-l-4 border-foreground/70 pl-3 pr-8 py-1.5 text-sm font-bold text-foreground">
          {movie.age === "Livre" ? "Livre" : movie.age}
        </div>
      </div>
    </section>
  );
}

/* ============ CARDS ============ */
