"use client";
import { useState, useEffect } from 'react';
export function useHomeHero(movies) {
  const [index, setCur] = useState(0);
  const cur = movies.length ? index % movies.length : 0;
  useEffect(() => {
    if (movies.length < 2) return;
    const t = setInterval(() => setCur(p => (p + 1) % movies.length), 8000);
    return () => clearInterval(t);
  }, [movies.length]);
  return { cur, setCur, movie: movies[cur] };
}
