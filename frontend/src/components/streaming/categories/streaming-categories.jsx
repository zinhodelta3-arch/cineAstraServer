"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Film } from "lucide-react";
import useStreamingCategories from "@/hooks/streaming/categories/use-streaming-categories";
import PosterTile from "@/components/streaming/home/poster-tile";
import DetailsModal from "@/components/streaming/home/details-modal";
import CinemaStyles from "@/components/streaming/home/cinema-styles";
import Button from "@/components/streaming/home/button";
import styles from "./streaming-categories.module.css";

export default function StreamingCategories() {
  const { ready, error, retry, categories, category, genreId, invalidCategory, films, catalog,
    details, setDetails, closeDetails, favoriteIds, toggleList, progress, playFilm, actionError } = useStreamingCategories();

  return <main className={styles.page}>
    <CinemaStyles />
    <Link href="/streaming/home" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Voltar ao catálogo</Link>
    <header className={styles.heading}>
      <h1 className="f-display">Categorias</h1>
      <p>Escolha um gênero e encontre sua próxima sessão.</p>
    </header>
    {!ready && <div role={error ? "alert" : "status"} className={styles.message}>
      <p>{error || "Carregando categorias…"}</p>
      {error && <Button onClick={retry}>Tentar novamente</Button>}
    </div>}
    {ready && <>
      <nav aria-label="Categorias de filmes" className={styles.categories}>
        <Link href="/streaming/categorias" className={styles.category} aria-current={!genreId ? "page" : undefined}>
          <Film size={20} aria-hidden="true" /><strong>Todos os filmes</strong><span>{catalog.length} títulos</span><ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        {categories.map((item) => <Link key={item.id} href={`/streaming/categorias?genero=${encodeURIComponent(item.id)}`} scroll={false}
          className={styles.category} aria-current={genreId === item.id ? "page" : undefined}>
          <Film size={20} aria-hidden="true" /><strong>{item.name}</strong><span>{item.count} {item.count === 1 ? "filme" : "filmes"}</span><ArrowUpRight size={16} aria-hidden="true" />
        </Link>)}
      </nav>
      <section aria-labelledby="category-results" className={styles.results}>
        <div className={styles.resultsHeading}>
          <h2 id="category-results" className="f-display">{invalidCategory ? "Categoria não encontrada" : category?.nome || "Todos os filmes"}</h2>
          <p role="status" aria-live="polite">{films.length} {films.length === 1 ? "filme disponível" : "filmes disponíveis"}</p>
        </div>
        {actionError && <p role="alert" className="mb-6 text-destructive">{actionError}</p>}
        {films.length ? <div className={styles.films}>
          {films.map((movie) => <PosterTile key={movie.id} movie={movie} onSelect={setDetails} inList={favoriteIds.has(movie.id)} />)}
        </div> : <div className={styles.message}>
          <p>{invalidCategory ? "Escolha uma das categorias acima para continuar." : "Nenhum filme nesta categoria no momento."}</p>
          <Link href="/streaming/categorias" className="text-primary underline">Ver todos os filmes</Link>
        </div>}
      </section>
      {details && <DetailsModal key={details.id} movie={details} onClose={closeDetails} onPlay={playFilm}
        inList={favoriteIds.has(details.id)} onToggleList={toggleList} catalog={catalog} progress={progress} />}
    </>}
  </main>;
}
