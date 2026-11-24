"use client";
import { useState } from 'react';
import { usePublicList } from './use-public-list';
import { filmCard } from '@/lib/api/public-api.mjs';
export function useCinemaHome() {
  const catalog = usePublicList('/films?cinema=true&upcoming=false&page=1&limit=20');
  const upcoming = usePublicList('/films?cinema=true&upcoming=true&sale=closed&page=1&limit=12');
  const presale = usePublicList('/films?cinema=true&upcoming=true&sale=open&page=1&limit=12');
  const highlights = usePublicList('/films?showcase=true&limit=8');
  const [bookingMovie, setBookingMovie] = useState(null);
  const movies = catalog.items.map(filmCard);
  return { catalog, upcoming, presale, highlights, movies, comingSoon: upcoming.items.map(filmCard), presales:presale.items.map(filmCard), bookingMovie, setBookingMovie };
}
