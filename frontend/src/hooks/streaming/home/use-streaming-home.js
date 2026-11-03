"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { publicGet } from "@/lib/api/public-api.mjs";
import { loadMyAccesses, loadProfileItems, loadStreamingFilms, loadStreamingGenres, streamingMovie, streamingRequest } from "@/lib/api/streaming-data.mjs";

export default function useStreamingHome() {
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [genres, setGenres] = useState([]);
  const [popularIds, setPopularIds] = useState([]);
  const [profile, setProfile] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [history, setHistory] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [genre, setGenre] = useState("Todos");
  const [playing, setPlaying] = useState(null);
  const [details, setDetails] = useState(null);
  const [isListOpen, setIsListOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [films, allGenres, profiles, popular] = await Promise.all([
          loadStreamingFilms(controller.signal), loadStreamingGenres(controller.signal),
          streamingRequest("/profiles", { signal: controller.signal }),
          publicGet("/films/popular", { signal: controller.signal }).catch(() => ({ items: [] })),
        ]);
        const active = profiles.items?.find((item) => item.id === profiles.activeProfileId) || profiles.items?.[0];
        if (!active) { router.replace("/streaming/perfis"); return; }
        const [favorites, watched, owned] = await Promise.all([
          loadProfileItems(active.id, "favorites", controller.signal),
          loadProfileItems(active.id, "history", controller.signal),
          loadMyAccesses(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setCatalog(films.map(streamingMovie));
        setGenres(allGenres);
        setPopularIds(Array.isArray(popular?.items) ? popular.items.map((item) => String(item.id_filme)) : []);
        setProfile(active);
        setFavoriteIds(favorites.map((item) => item.filmId));
        setHistory(watched);
        setAccesses(owned);
        setError("");
        setReady(true);
      } catch (cause) {
        if (!controller.signal.aborted) { setError(cause.message || "Não foi possível carregar o streaming."); setReady(false); }
      }
    }
    load();
    return () => controller.abort();
  }, [revision, router]);

  const chooseGenre = (value) => { setGenre(value); setActionError(""); };
  const released = useMemo(() => catalog.filter((movie) => !movie.soon), [catalog]);
  const byId = useMemo(() => new Map(catalog.map((movie) => [movie.id, movie])), [catalog]);
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const myList = favoriteIds.map((id) => byId.get(id)).filter(Boolean);
  const popular = popularIds.map((id) => byId.get(id)).filter((movie) => movie && !movie.soon);
  const heroes = [...new Map([...popular, ...released].map((movie) => [movie.id, movie])).values()].sort((a, b) => Number(b.hasArtwork) - Number(a.hasArtwork)).slice(0, 4);
  const recent = history.filter((item) => item.positionSeconds > 0 && item.catalogAvailable).map((item) => byId.get(item.filmId)).filter((movie) => movie && !movie.soon).slice(0, 12);
  const continuing = history.filter((item) => !item.completed && item.positionSeconds > 0 && item.catalogAvailable).map((item) => byId.get(item.filmId)).filter((movie) => movie && !movie.soon).slice(0, 12);
  const genreRows = genres.map((item) => ({ id: String(item.id_genero), title: item.nome,
    films: released.filter((movie) => movie.genreIds.includes(String(item.id_genero))).slice(0, 12),
  })).filter((row) => row.films.length > 0);
  const premieres = [...released].filter((movie) => movie.releaseDate).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).slice(0, 12);
  const soon = catalog.filter((movie) => movie.soon);
  const progress = Object.fromEntries(history.map((item) => [item.filmId, Math.min(100, Math.round(item.positionSeconds / Math.max(1, item.durationSeconds) * 100))]));
  const filtered = genre === "Todos" ? catalog : catalog.filter((movie) => movie.genreIds.includes(genre));
  const accessByFilm = Object.fromEntries(accesses.filter((item) => item.available).map((item) => [item.filmId, item]));

  const toggleList = async (movie) => {
    if (!profile) return;
    const adding = !favorites.has(movie.id);
    setActionError("");
    try {
      await streamingRequest(`/profiles/${profile.id}/favorites/${movie.id}`, { method: adding ? "PUT" : "DELETE", body: adding ? {} : undefined });
      setFavoriteIds((current) => adding ? [...current, movie.id] : current.filter((id) => id !== movie.id));
    } catch (cause) { setActionError(cause.message || "Não foi possível atualizar sua lista."); }
  };
  const updateProgress = (item) => setHistory((current) => [item, ...current.filter((entry) => entry.filmId !== item.filmId)]);
  return {
    ready, error, actionError, setActionError, retry: () => setRevision((value) => value + 1),
    catalog, genres, genreRows, genre, chooseGenre, filtered, popular, heroes, recent, continuing, premieres, soon, progress,
    profile, history, explore: released.slice(0, 12), myList, favoriteIds: favorites, toggleList, accessByFilm, updateProgress,
    playing, setPlaying, details, setDetails, isListOpen, setIsListOpen,
    closePlayer: () => setPlaying(null), closeDetails: () => setDetails(null),
    openList: () => setIsListOpen(true), closeList: () => setIsListOpen(false),
  };
}
