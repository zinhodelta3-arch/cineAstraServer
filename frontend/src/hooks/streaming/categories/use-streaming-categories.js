"use client";

import { useRouter, useSearchParams } from "next/navigation";
import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";

export default function useStreamingCategories() {
  const data = useStreamingHome();
  const params = useSearchParams();
  const router = useRouter();
  const genreId = params.get("genero") || "";
  const category = data.genres.find((item) => String(item.id_genero) === genreId);
  const invalidCategory = Boolean(genreId && !category);
  const films = genreId ? data.catalog.filter((film) => film.genreIds.includes(genreId)) : data.catalog;
  const categories = data.genres.map((item) => ({
    id: String(item.id_genero), name: item.nome,
    count: data.catalog.filter((film) => film.genreIds.includes(String(item.id_genero))).length,
  }));

  return {
    ...data, genreId, category, categories, invalidCategory, films: invalidCategory ? [] : films,
    playFilm: (movie) => router.push(`/streaming/assistir/filme/${encodeURIComponent(movie.id)}`),
  };
}
