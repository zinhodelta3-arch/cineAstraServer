"use client";
import { useState, useEffect } from "react";

export default function useStreamHero(myList, heroes) {
  const [cur, setCur] = useState(0);
  const total = heroes.length;
  const go = (d) => setCur((p) => total ? (p + d + total) % total : 0);

  useEffect(() => {
    if (!total) return;
    const t = setTimeout(() => setCur((p) => (p + 1) % total), 9000);
    return () => clearTimeout(t);
  }, [cur, total]);

  const movie = heroes[cur % total];
  if (!movie) return { cur: 0, setCur, go, movie: null, inList: false };
  const inList = myList.some((i) => i.id === movie.id);

  return { cur, setCur, go, movie, inList };
}
