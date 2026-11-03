"use client";

import { useState } from "react";
import FilmArt from "./film-art";

export default function Art({ movie, variant = "thumb", showTitle = true, className = "size-full object-cover" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = variant === "poster" ? movie.poster : variant === "backdrop" ? movie.backdrop : movie.thumb;
  if (src && failedSrc !== src) return <img src={src} alt={`Arte de ${movie.title}`} className={className} onError={() => setFailedSrc(src)} />;
  return <FilmArt movie={movie} showTitle={showTitle && variant !== "backdrop"} className={className} />;
}
