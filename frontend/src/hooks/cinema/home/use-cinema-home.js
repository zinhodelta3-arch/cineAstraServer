"use client";
import { useState } from 'react';
import { usePublicList } from './use-public-list';
import { filmCard } from '@/lib/api/public-api.mjs';
import { useCinemaLocation } from '@/components/providers/cinema-location-provider';
export function useCinemaHome() {
  const { ready, location } = useCinemaLocation();
  const path = query => ready ? `/films?${query}${location ? `&localId=${location.id_local}` : ''}` : null;
  const catalog = usePublicList(path('cinema=true&upcoming=false&page=1&limit=20'));
  const upcoming = usePublicList(path('cinema=true&upcoming=true&sale=closed&page=1&limit=12'));
  const presale = usePublicList(path('cinema=true&upcoming=true&sale=open&page=1&limit=12'));
  const highlights = usePublicList(path('showcase=true&limit=8'));
  const [bookingMovie, setBookingMovie] = useState(null);
  const movies = catalog.items.map(filmCard);
  return { ready, location, catalog, upcoming, presale, highlights, movies, comingSoon: upcoming.items.map(filmCard), presales:presale.items.map(filmCard), bookingMovie, setBookingMovie };
}
