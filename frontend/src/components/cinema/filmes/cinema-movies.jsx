"use client";

import { Film, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import TablePagination from "@/components/ui/table-pagination";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useCinemaMovies } from "@/hooks/cinema/filmes/use-cinema-movies";
import { moviePageSizes } from "@/lib/api/cinema-movies.mjs";
import ListStatus from "@/components/cinema/home/list-status";
import SessionListModal from "@/components/cinema/home/session-list-modal";
import { SECTIONS } from "./movie-utils";
import CatalogNavigation from "./catalog-navigation";
import MovieFilters from "./movie-filters";
import MoviePoster from "./movie-poster";
import MovieDetailsDialog from "./movie-details-dialog";
import styles from "./filmes.module.css";

export default function CinemaMoviesPage() {
  const results = useRef(null);
  const catalog = useCinemaMovies();
  const { section, genre, query, selectedMovie, visibleMovies, activeLabel,
    setSelectedMovie, changeDetailsOpen, changeSection, clearFilters } = catalog;
  const { films, searching } = catalog;

  function changePage(action, ...args) {
    action(...args);
    results.current?.focus({ preventScroll: true });
    results.current?.scrollIntoView({ block: "start" });
  }

  const pagination = {
    ...films,
    loading: films.loading || searching,
    nextPage: () => changePage(films.nextPage),
    previousPage: () => changePage(films.previousPage),
    goToPage: page => changePage(films.goToPage, page),
    setPageSize: size => changePage(films.setPageSize, size),
  };

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
              {(catalog.genreList.cursor || catalog.genreList.error) && <ListStatus list={catalog.genreList} empty="" more="Carregar mais gêneros" />}

              <div ref={results} tabIndex={-1} aria-label="Resultados do catálogo"
                className="mb-6 flex min-h-6 scroll-mt-28 flex-wrap items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <p className="text-xs font-semibold text-muted-foreground">{activeLabel}</p>
                {(genre !== "Todos" || query) && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 gap-1.5 px-0 text-[11px] text-muted-foreground hover:bg-transparent"><X className="size-3" />Limpar filtros</Button>}
              </div>

              <div aria-busy={films.loading || searching}>
              {visibleMovies.length ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-11">
                  {visibleMovies.map((movie, index) => <MoviePoster key={movie.id} movie={movie} index={index} onSelect={setSelectedMovie} />)}
                </div>
              ) : !films.loading && !films.error && !searching ? (
                <div className="flex min-h-72 flex-col items-center justify-center border-y border-dashed border-border px-6 text-center">
                  <Film className="mb-4 size-7 text-primary" aria-hidden="true" />
                  <h2 className={`${styles.display} text-3xl font-bold`}>Nenhum filme por aqui</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Tente outro título, gênero ou aba para encontrar seu filme.</p>
                  {(genre !== "Todos" || query) && <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-full">Ver todos nesta aba</Button>}
                </div>
              ) : null}
              </div>
              <ListStatus list={{ loading: films.loading || searching, error: searching ? null : films.error, items: [], retry: films.reload }} empty="" />
              {(visibleMovies.length > 0 || films.page > 1) && (
                <div className={`${styles.sectionDivider} mt-8`}>
                  <TablePagination list={pagination} noun="filmes" pageSizes={moviePageSizes} />
                </div>
              )}
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
