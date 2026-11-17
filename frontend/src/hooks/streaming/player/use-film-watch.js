"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadMyAccesses, streamingMovie, streamingRequest } from "@/lib/api/streaming-data.mjs";
import { publicGet } from "@/lib/api/public-api.mjs";

export async function loadWatchProfile(signal) {
  const profiles = await streamingRequest("/profiles", { signal });
  return profiles.items?.find((item) => item.id === profiles.activeProfileId) ?? profiles.items?.[0];
}

export default function useFilmWatch(filmId) {
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (!/^[1-9]\d{0,19}$/.test(filmId)) throw new Error("Filme não encontrado.");
        const film = await publicGet(`/films/${filmId}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!film.disponivel_streaming) throw new Error("Este filme não está disponível no streaming.");
        const movie = streamingMovie(film);
        setState({ filmId, revision, loading: false, movie });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ filmId, revision, loading: false, error: cause.message || "Não foi possível carregar o filme." });
      }
    }
    void load();
    return () => controller.abort();
  }, [filmId, revision]);

  const view = state?.filmId === filmId && state.revision === revision ? state : { loading: true };
  const prepare = useCallback(async (signal) => {
    const profile = await loadWatchProfile(signal);
    signal?.throwIfAborted();

    if (!profile) {
      router.push("/streaming/perfis");
      return null;
    }
    const accesses = await loadMyAccesses(signal);
    return { profileId: profile.id, access: accesses.find((item) => String(item.filmId) === filmId && item.available) };
  }, [filmId, router]);
  return { ...view, prepare, retry: () => setRevision((value) => value + 1) };
}
