"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import useStreamingSearch from "@/hooks/streaming/search/use-streaming-search";
import CinemaStyles from "@/components/streaming/home/cinema-styles";
import PosterTile from "@/components/streaming/home/poster-tile";
import { useStreamingDetails } from "@/components/streaming/home/streaming-details-provider";
import Button from "@/components/streaming/home/button";
import styles from "./streaming-search.module.css";

export default function StreamingSearch() {
  const { ready, error, retry, query, genre, films, genres, submit } = useStreamingSearch();
  const openDetails = useStreamingDetails();
  return <main className={styles.page}>
    <CinemaStyles />
    <Link href="/streaming/home" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Voltar ao catálogo</Link>
    <header className={styles.heading}>
      <h1 className="f-display">Buscar no catálogo</h1>
    </header>
    <form key={JSON.stringify([query, genre])} role="search" aria-label="Filtrar catálogo" className={styles.filters} onSubmit={submit}>
      <label>Buscar filmes<input name="q" type="search" maxLength={200} defaultValue={query} /></label>
      <label>Gênero<select key={String(ready)} name="genero" defaultValue={genre}>
        <option value="">Todos os gêneros</option>
        {genres.map((item) => <option key={item.id_genero} value={item.id_genero}>{item.nome}</option>)}
      </select></label>
      <Button type="submit">Buscar</Button>
    </form>
    {!ready && <div className={styles.message} role={error ? "alert" : "status"}>
      <p>{error || "Buscando no catálogo…"}</p>{error && <Button onClick={retry}>Tentar novamente</Button>}
    </div>}
    {ready && <section aria-labelledby="search-results">
      <div className={styles.resultsHeading}>
        <h2 id="search-results">{query ? <>Resultados para “{query}”</> : "Filmes"}</h2>
        <p role="status">{films.length} {films.length === 1 ? "resultado" : "resultados"}</p>
      </div>
      {films.length ? <div className={styles.films}>
        {films.map((movie) => <PosterTile key={movie.id} movie={movie} onSelect={openDetails} />)}
      </div> : <div className={styles.message}>
        <Search size={28} aria-hidden="true" />
        <h3>Nenhum filme encontrado</h3>
        <Link href="/streaming/busca" className="text-primary underline">Limpar filtros</Link>
      </div>}
    </section>}
  </main>;
}
