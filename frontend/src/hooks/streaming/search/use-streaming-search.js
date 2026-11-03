"use client";

import { useSearchParams, useRouter } from "next/navigation";
import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";
import { normalizeSearch, searchStreamingFilms } from "@/lib/streaming-search.mjs";

export default function useStreamingSearch() {
  const data = useStreamingHome();
  const params = useSearchParams();
  const router = useRouter();
  const query = (params.get("q") || "").slice(0, 200).trim();
  const searching = Boolean(normalizeSearch(query));
  const films = searching ? searchStreamingFilms(data.catalog, query) : data.heroes;
  const categories = searching ? data.genres.filter((item) => normalizeSearch(item.nome).includes(normalizeSearch(query))) : [];
  return { ...data, query, searching, films, categories,
    playFilm: (movie) => router.push(`/streaming/assistir/filme/${encodeURIComponent(movie.id)}`),
  };
}
