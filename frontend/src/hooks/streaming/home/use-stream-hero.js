"use client";
import { useState, useEffect } from "react";
import { HERO_FILMS } from "@/components/streaming/home/data";

export default function useStreamHero(myList) {
  const [cur, setCur] = useState(0);
  const total = HERO_FILMS.length;
  const go = (d) => setCur((p) => (p + d + total) % total);

  useEffect(() => {
    const t = setTimeout(() => setCur((p) => (p + 1) % total), 9000);
    return () => clearTimeout(t);
  }, [cur, total]);

  const movie = HERO_FILMS[cur];
  const inList = myList.some((i) => i.id === movie.id);

  return { cur, setCur, go, movie, inList };
}
