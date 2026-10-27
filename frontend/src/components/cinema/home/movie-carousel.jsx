"use client";

import { Film, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "./home-ui";
import PosterCard from "./poster-card";
import { useMovieCarousel } from "@/hooks/cinema/home/use-movie-carousel";

export default function MovieCarousel({ id, title, movies, soon = false, onSelectMovie }) {
  const { ref, controlsReady, page, pages, canGoBack, canGoNext, update, go, goTo } = useMovieCarousel(movies);

  return (
    <section id={id} className="relative py-7" aria-label={title}>
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-stretch gap-3">
            <div className="perf-v rounded-sm" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-0.5">
                {soon ? <Flame className="w-3.5 h-3.5" aria-hidden="true" /> : <Film className="w-3.5 h-3.5" aria-hidden="true" />}
                {soon ? "Próximos lançamentos" : "Catálogo de cinema"}
              </div>
              <h2 className="f-display uppercase text-3xl md:text-4xl font-black leading-[0.95] text-foreground">{title}</h2>
            </div>
          </div>
          <div className="flex min-h-10 min-w-[88px] items-center justify-end gap-2">
            {controlsReady && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Anterior"
                  disabled={!canGoBack}
                  onClick={() => go(-1)}
                  className="!rounded-lg bg-muted/60 disabled:opacity-40"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Próximo"
                  disabled={!canGoNext}
                  onClick={() => go(1)}
                  className="!rounded-lg bg-muted/60 disabled:opacity-40"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div ref={ref} onScroll={update} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
          {movies.map((m) => (
            <div key={m.id} className="snap-start shrink-0 w-[40%] sm:w-[27%] md:w-[20%] lg:w-[16%]">
              <PosterCard movie={m} soon={soon} onSelectMovie={onSelectMovie} />
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-5" role="tablist" aria-label={`Páginas de ${title}`}>
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === page} aria-label={`Página ${i + 1}`} onClick={() => goTo(i)}
                className={`h-1.5 w-20 rounded-full transition-colors ${i === page ? "bg-foreground" : "bg-muted-foreground/40 hover:bg-muted-foreground/70"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
