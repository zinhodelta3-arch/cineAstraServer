"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import useFilmWatch from "@/hooks/streaming/player/use-film-watch";
import PlayerModal from "@/components/streaming/home/player-modal";
import styles from "./film-watch.module.css";

export default function FilmWatch({ filmId }) {
  const { loading, error, movie, profile, access, retry, close } = useFilmWatch(filmId);
  return <main className={styles.page}>
    <Link href="/streaming/home" className={styles.back}><ArrowLeft size={18} aria-hidden="true" />Voltar ao catálogo</Link>
    {loading && <p role="status">Preparando sua sessão…</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" onClick={retry} className={styles.retry}>Tentar novamente</button></div>}
    {movie && <>
      <h1 className={styles.title}>{movie.title}</h1>
      <div className={styles.player}><PlayerModal key={movie.id} movie={movie} profileId={profile.id} access={access} onClose={close} initialMode="page" /></div>
      <section className={styles.information} aria-label="Informações do filme">
        <p className={styles.meta}>{movie.age === "Livre" ? "Livre" : `${movie.age} anos`} · {movie.duration} · {movie.genre}</p>
        <p>{movie.synopsis}</p>
        {movie.director && <p className={styles.meta}>Direção: {movie.director}</p>}
      </section>
    </>}
  </main>;
}
