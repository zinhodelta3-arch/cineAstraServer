"use client";
import { useId } from "react";
import { PALETTES, wrapTitle } from "@/components/streaming/home/art-utils";

export default function useFilmArt(movie) {
  const id = useId().replace(/:/g, "");
  const p = PALETTES[movie.pal % PALETTES.length];
  const lines = wrapTitle(movie.title);
  const maxLen = Math.max(...lines.map((l) => l.length));
  const size = Math.min(120, Math.max(56, 520 / (maxLen * 0.5)));
  const lh = size * 0.9;
  const lastY = 600;

  return { id, p, lines, size, lh, lastY };
}
