"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadMyAccesses, loadStreamingFilms, streamingMovie, streamingRequest } from "@/lib/api/streaming-data.mjs";

export default function useFilmWatch(filmId) {
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    async function load() {
      try {
        if (!/^[1-9]\d{0,19}$/.test(filmId)) throw new Error("Filme não encontrado.");
        const [films, profiles, accesses] = await Promise.all([
          loadStreamingFilms(controller.signal),
          streamingRequest("/profiles", { signal: controller.signal }),
          loadMyAccesses(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const film = films.find((item) => String(item.id_filme) === filmId);
        if (!film) throw new Error("Este filme não está disponível no streaming.");
        const movie = streamingMovie(film);
        if (movie.soon) throw new Error("Este filme ainda não estreou. Volte ao catálogo para escolher outro título.");
        const profile = profiles.items?.find((item) => item.id === profiles.activeProfileId) || profiles.items?.[0];
        if (!profile) { router.replace("/streaming/perfis"); return; }
        const access = accesses.find((item) => String(item.filmId) === filmId && item.available);
        setState({ loading: false, movie, profile, access });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ loading: false, error: cause.message || "Não foi possível carregar o filme." });
      }
    }
    void load();
    return () => controller.abort();
  }, [filmId, revision, router]);

  return { ...state, retry: () => setRevision((value) => value + 1), close: () => router.push("/streaming/home") };
}
