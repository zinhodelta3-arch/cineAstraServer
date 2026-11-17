"use client";
import { useState, useEffect } from 'react';
export function useHomeHero(movies, paused = false, intervalMs = 8000) {
  const [index, setCur] = useState(0);
  const cur = movies.length ? index % movies.length : 0;
  useEffect(() => {
    if (paused || movies.length < 2) return;
    const t = setInterval(() => {
      if (document.hidden || document.documentElement.dataset.caMotion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setCur(p => (p + 1) % movies.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [movies.length, paused, intervalMs]);
  return { cur, setCur, movie: movies[cur] };
}
