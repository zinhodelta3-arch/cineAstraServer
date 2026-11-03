"use client";
import { useState } from 'react';
import { usePublicList } from './use-public-list';
import { filmCard } from '@/lib/api/public-api.mjs';
export function useCinemaHome() {
  const catalog = usePublicList('/films?cinema=true&upcoming=false&limit=20');
  const upcoming = usePublicList('/films?cinema=true&upcoming=true&limit=20');
  const popular = usePublicList('/films/popular');
  const [bookingMovie, setBookingMovie] = useState(null);
  const movies = catalog.items.map(filmCard);
  return { catalog, upcoming, popular, movies, nowPlaying: movies, comingSoon: upcoming.items.map(filmCard), bookingMovie, setBookingMovie };
}
