"use client";

import { Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useCinemaMovies } from "@/hooks/cinema/filmes/use-cinema-movies";
import ListStatus from "@/components/cinema/home/list-status";
import SessionListModal from "@/components/cinema/home/session-list-modal";
import { SECTIONS } from "./movie-utils";
import CatalogNavigation from "./catalog-navigation";
import MovieFilters from "./movie-filters";
import MoviePoster from "./movie-poster";
import MovieDetailsDialog from "./movie-details-dialog";
import styles from "./filmes.module.css";

export default function CinemaMoviesPage() {
  const catalog = useCinemaMovies();
  const { section, genre, query, selectedMovie, visibleMovies, activeLabel,
    setSelectedMovie, changeDetailsOpen, changeSection, clearFilters } = catalog;

  return (
    <main className={`${styles.root} min-h-screen bg-background text-foreground`}>
      <div className={`${styles.content} mx-auto max-w-[1240px] px-5 pb-16 pt-10 sm:px-8 lg:pt-14`}>
        <div className="mb-8 flex items-stretch gap-4">
          <div className={styles.verticalPerf} aria-hidden="true" />
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><Film className="size-3.5" aria-hidden="true" /> Cinema</p>
            <h1 className={`${styles.display} text-5xl font-black uppercase leading-[0.95] sm:text-7xl`}>Filmes no cinema</h1>
          </div>
        </div>

        <Tabs value={section} onValueChange={changeSection} className="flex w-full flex-col gap-0">
          <CatalogNavigation />

          <div className={styles.filmStrip} aria-hidden="true" />

          {SECTIONS.map((item) => (
            <TabsContent key={item.value} value={item.value} className="mt-0 outline-none">
              <MovieFilters catalog={catalog} item={item} />
              <ListStatus list={catalog.genreList} empty="" more="Carregar mais gêneros" />

              <div className="mb-6 flex min-h-6 flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground" role="status" aria-live="polite">
                  <span className="font-semibold text-foreground">{visibleMovies.length} {visibleMovies.length === 1 ? "filme" : "filmes"}</span> · {activeLabel}
                  {catalog.films.cursor ? " · na parte carregada do catálogo" : ""}
                </p>
                {(genre !== "Todos" || query) && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 gap-1.5 px-0 text-[11px] text-muted-foreground hover:bg-transparent"><X className="size-3" />Limpar filtros</Button>}
              </div>

              {visibleMovies.length ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-11">
                  {visibleMovies.map((movie, index) => <MoviePoster key={movie.id} movie={movie} index={index} onSelect={setSelectedMovie} />)}
                </div>
              ) : !catalog.films.loading && !catalog.films.error && !catalog.searching ? (
                <div className="flex min-h-72 flex-col items-center justify-center border-y border-dashed border-border px-6 text-center">
                  <Film className="mb-4 size-7 text-primary" aria-hidden="true" />
                  <h2 className={`${styles.display} text-3xl font-bold`}>Nenhum filme por aqui</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">{catalog.films.cursor ? "Nenhum filme desta aba na parte carregada. Carregue mais filmes para continuar." : "Tente outro título, gênero ou aba para encontrar seu filme."}</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-full">Ver todos nesta aba</Button>
                </div>
              ) : null}
              {catalog.searching && <p role="status">Buscando filmes…</p>}
              <ListStatus list={catalog.films} empty="" more="Carregar mais filmes" />
            </TabsContent>
          ))}
        </Tabs>

        <div className={`${styles.sectionDivider} mt-12 flex flex-wrap items-center justify-between gap-3 pt-5 text-[10px] uppercase tracking-widest text-muted-foreground`}>
          <span>CineAstra · Cinema</span>
          <span>Catálogo do cinema</span>
        </div>
      </div>

      <MovieDetailsDialog selectedMovie={selectedMovie} onOpenChange={changeDetailsOpen} onSessions={movie => { setSelectedMovie(null); catalog.setSessionMovie(movie); }} />
      {catalog.sessionMovie && <SessionListModal movie={catalog.sessionMovie} onClose={() => catalog.setSessionMovie(null)} />}
    </main>
  );
}
