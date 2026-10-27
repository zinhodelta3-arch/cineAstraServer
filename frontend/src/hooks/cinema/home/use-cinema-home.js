"use client";
import { useState } from 'react';
import { usePublicList } from './use-public-list';
import { filmCard } from '@/lib/api/public-api.mjs';
export function useCinemaHome() {
  const catalog = usePublicList('/films?cinema=true&limit=20');
  const [bookingMovie, setBookingMovie] = useState(null);
  const movies = catalog.items.map(filmCard);
  const today = new Date().toLocaleDateString('sv-SE');
  return { catalog, movies, nowPlaying: movies.filter(m => !m.releaseDate || m.releaseDate <= today), comingSoon: movies.filter(m => m.releaseDate > today), bookingMovie, setBookingMovie };
}
