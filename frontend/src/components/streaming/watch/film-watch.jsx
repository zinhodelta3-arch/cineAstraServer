"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import useFilmWatch from "@/hooks/streaming/player/use-film-watch";
import { useStreamingPlayer } from "@/components/streaming/home/streaming-player-provider";
import styles from "./film-watch.module.css";

export default function FilmWatch({ filmId, autoStart }) {
  return <FilmDetails key={filmId} filmId={filmId} autoStart={autoStart} />;
}

function FilmDetails({ filmId, autoStart }) {
  const { loading, error, movie, retry, prepare } = useFilmWatch(filmId);
  const { play, session } = useStreamingPlayer();
  const playerOpen = session?.movie.id === filmId;
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const preparation = useRef(null);

  const start = useCallback(async () => {
    if (!movie || movie.soon || preparation.current) return;
    const controller = new AbortController();
    preparation.current = controller;
    setStarting(true);
    setMessage("");
    try {
      const playback = await prepare(controller.signal);
      if (playback && !controller.signal.aborted) play({ movie, ...playback, pathname: `/streaming/assistir/filme/${filmId}` });
    } catch (cause) {
      if (!controller.signal.aborted) setMessage(cause.message || "Não foi possível iniciar a reprodução.");
    } finally {
      if (preparation.current === controller) {
        preparation.current = null;
        setStarting(false);
      }
    }
  }, [filmId, movie, play, prepare]);

  useEffect(() => {
    if (autoStart) void start();
    return () => {
      const controller = preparation.current;
      preparation.current = null;
      controller?.abort();
    };
  }, [autoStart, start]);

  if (playerOpen) return null;

  return <main className={styles.stage}>
    <div className={styles.recovery}>
      <h1 className="sr-only">{movie?.title ?? "Reprodução do filme"}</h1>
      {(loading || starting) && <p role="status">{starting ? "Preparando reprodução…" : "Carregando filme…"}</p>}
      {error && <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={retry} className={styles.primary}>Tentar novamente</button>
      </div>}
      {message && <p role="alert">{message}</p>}
      {movie?.soon && <p>Disponível em <time dateTime={movie.releaseDate}>{movie.releaseDate.split("-").reverse().join("/")}</time></p>}
      {movie && !movie.soon && !starting && <button className={styles.primary} type="button" onClick={start}>
        <Play size={17} aria-hidden="true" />Assistir
      </button>}
      <Link href="/streaming/home" className={styles.back}><ArrowLeft size={18} aria-hidden="true" />Voltar ao catálogo</Link>
    </div>
  </main>;
}
