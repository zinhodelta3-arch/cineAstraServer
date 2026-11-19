"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";

export default function useStreamingCategories() {
  const data = useStreamingHome({ includePopular: false });
  const params = useSearchParams();
  const genreId = params.get("genero") || "";
  const category = data.genres.find((item) => String(item.id_genero) === genreId);
  const invalidCategory = Boolean(data.ready && genreId && !category);
  const films = invalidCategory ? [] : genreId ? data.catalog.filter((film) => film.genreIds.includes(genreId)) : data.catalog;
  const categories = useMemo(() => {
    const counts = new Map();
    for (const movie of data.catalog) {
      for (const id of movie.genreIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return data.genres.map((item) => ({
      id: String(item.id_genero), name: item.nome, count: counts.get(String(item.id_genero)) ?? 0,
    }));
  }, [data.catalog, data.genres]);

  return {
    ...data, catalogSize: data.catalog.length, genreId, category, categories, invalidCategory, films,
  };
}
