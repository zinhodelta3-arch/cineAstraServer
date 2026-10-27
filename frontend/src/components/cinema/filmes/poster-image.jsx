"use client";

import { Film } from "lucide-react";
import { useMoviePoster } from "@/hooks/cinema/filmes/use-movie-poster";

export default function PosterImage({ movie, className = "", eager = false }) {
  const { failed, onError } = useMoviePoster(movie.poster);
  return failed ? (
    <div className={`flex h-full w-full flex-col items-center justify-end gap-3 bg-gradient-to-br from-secondary via-card to-background p-5 text-center text-foreground ${className}`}>
      <Film aria-hidden="true" className="size-6 text-primary" />
      <span className="text-xs">Cartaz de {movie.title}</span>
    </div>
  ) : (
    <img src={movie.poster} alt={`Cartaz de ${movie.title}`} width={500} height={750}
      loading={eager ? "eager" : "lazy"} decoding="async" className={className} onError={onError} />
  );
}
