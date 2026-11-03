"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";
import useStreamingSearch from "@/hooks/streaming/search/use-streaming-search";
import CinemaStyles from "@/components/streaming/home/cinema-styles";
import PosterTile from "@/components/streaming/home/poster-tile";
import DetailsModal from "@/components/streaming/home/details-modal";
import Button from "@/components/streaming/home/button";
import styles from "./streaming-search.module.css";

export default function StreamingSearch() {
  const { ready, error, retry, query, searching, films, categories, catalog, details, setDetails,
    closeDetails, favoriteIds, toggleList, progress, playFilm, actionError } = useStreamingSearch();
  return <main className={styles.page}>
    <CinemaStyles />
    <Link href="/streaming/home" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Voltar ao catálogo</Link>
    <header className={styles.heading}>
      <h1 className="f-display">{searching ? <>Resultados para “{query}”</> : "Encontre seu próximo filme"}</h1>
      <p>{searching ? "Explore os títulos e as categorias encontrados no catálogo." : "Abra a busca no header e digite um título, gênero ou nome da direção."}</p>
    </header>
    {!ready && <div className={styles.message} role={error ? "alert" : "status"}>
      <p>{error || "Buscando no catálogo…"}</p>{error && <Button onClick={retry}>Tentar novamente</Button>}
    </div>}
    {ready && <>
      {categories.length > 0 && <nav className={styles.categories} aria-label="Categorias encontradas">
        {categories.map((item) => <Link key={item.id_genero} href={`/streaming/categorias?genero=${encodeURIComponent(item.id_genero)}`}>
          {item.nome}<ArrowUpRight size={16} aria-hidden="true" />
        </Link>)}
      </nav>}
      <section aria-labelledby="search-results">
        <div className={styles.resultsHeading}>
          <h2 id="search-results">{searching ? "Filmes encontrados" : "Para começar a explorar"}</h2>
          {searching && <p role="status" aria-live="polite">{films.length} {films.length === 1 ? "resultado" : "resultados"}</p>}
        </div>
        {actionError && <p role="alert" className="mb-6 text-destructive">{actionError}</p>}
        {films.length ? <div className={styles.films}>
          {films.map((movie) => <PosterTile key={movie.id} movie={movie} onSelect={setDetails} inList={favoriteIds.has(movie.id)} />)}
        </div> : <div className={styles.message}>
          <Search size={28} aria-hidden="true" />
          <h3>{searching ? "Nenhum filme encontrado" : "Nenhum título disponível no momento"}</h3>
          <p>{searching ? "Tente outra palavra, parte do título ou um gênero." : "Volte mais tarde para conferir o catálogo."}</p>
          <Link href="/streaming/categorias" className="text-primary underline">Explorar categorias</Link>
        </div>}
      </section>
      {details && <DetailsModal key={details.id} movie={details} onClose={closeDetails} onPlay={playFilm}
        inList={favoriteIds.has(details.id)} onToggleList={toggleList} catalog={catalog} progress={progress} />}
    </>}
  </main>;
}
