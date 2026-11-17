"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStreamingFilms, loadStreamingGenres, streamingMovie } from "@/lib/api/streaming-data.mjs";
import { searchStreamingFilms } from "@/lib/streaming-search.mjs";

export default function useStreamingSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const query = (params.get("q") || "").slice(0, 200).trim();
  const genre = params.get("genero") || "";
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([loadStreamingFilms(controller.signal), loadStreamingGenres(controller.signal)])
      .then(([films, genres]) => {
        if (!controller.signal.aborted) setResult({ revision, films: films.map(streamingMovie), genres });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setResult({ revision, error: cause.message || "Não foi possível carregar o catálogo." });
      });
    return () => controller.abort();
  }, [revision]);

  const current = result?.revision === revision ? result : null;
  const catalog = current?.films || [];
  const filtered = genre ? catalog.filter((film) => film.genreIds.includes(genre)) : catalog;
  const films = query ? searchStreamingFilms(filtered, query) : filtered;

  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    const title = values.get("q").trim();
    const selectedGenre = values.get("genero");
    if (title) next.set("q", title);
    if (selectedGenre) next.set("genero", selectedGenre);
    router.push(next.size ? "/streaming/busca?" + next : "/streaming/busca");
  }

  return { ready: Boolean(current?.films), error: current?.error, genres: current?.genres || [], films, query, genre, submit,
    retry: () => setRevision((value) => value + 1),
  };
}
