"use client";
import { useState } from "react";
import { useHomeHero } from "@/hooks/cinema/home/use-home-hero";

export default function useStreamHero(myList, heroes) {
  const [autoplay, setAutoplay] = useState(false);
  const { cur, setCur, movie } = useHomeHero(heroes, !autoplay, 9000);
  const total = heroes.length;
  const select = index => {
    setAutoplay(false);
    setCur(index);
  };
  const go = direction => select(index => total ? (index + direction + total) % total : 0);

  const inList = Boolean(movie && myList.some(i => i.id === movie.id));
  return { cur, select, go, movie, inList, autoplay, toggleAutoplay: () => setAutoplay(value => !value) };
}
