"use client";
import { useEffect, useRef, useState } from 'react';
import { usePublicList } from './use-public-list';
import { useFilmAvailability } from '../filmes/use-film-availability';
import { publicGet } from '@/lib/api/public-api.mjs';
import { useCinemaLocation } from '@/components/providers/cinema-location-provider';
export function useHomeSessions(movie) {
 const { location } = useCinemaLocation();
 const [selectedDate, setDate] = useState('');
 const [chosenLocalId, setLocalId] = useState(null);
 const [daysRevision, setDaysRevision] = useState(0);
 const localId = chosenLocalId ?? location?.id_local ?? '';
 const availability=useFilmAvailability(movie.id);
 const [days, setDays] = useState({ key: null, items: [], loading: false, error: null });
 const daysKey = `${localId}:${daysRevision}`;
 const currentDays = days.key === daysKey ? days : { items: [], loading: Boolean(localId), error: null };
 const date = currentDays.items.includes(selectedDate) ? selectedDate : currentDays.items[0] ?? '';
 const locations = usePublicList('/locations?limit=100&cinema=true');
 const rooms = usePublicList(localId ? `/locations/${localId}/rooms?limit=100` : null);
 const sessions = usePublicList(localId && date ? `/sessions?filmId=${movie.id}&localId=${localId}&date=${date}&limit=100` : null);
 const dialogRef = useRef(null);
 useEffect(() => {const dialog = dialogRef.current, previous = document.activeElement; dialog.showModal(); return () => {dialog.close(); previous?.focus();};}, []);
 useEffect(() => {
  if (!localId) return;
  const abort = new AbortController();
  publicGet(`/films/${movie.id}/available-days?localId=${localId}`, { signal: abort.signal })
   .then(data => { if (!abort.signal.aborted) setDays({ key: daysKey, items: data.days, loading: false, error: null }); })
   .catch(error => { if (!abort.signal.aborted) setDays({ key: daysKey, items: [], loading: false, error: error.message }); });
  return () => abort.abort();
 }, [movie.id, localId, daysKey]);
 const changeLocal = (id, day='') => { setLocalId(id); setDate(day); };
 const retryDays = () => setDaysRevision(value => value + 1);
 const available = sessions.items.filter(session => String(session.id_filme) === String(movie.id));
 return {
  dialogRef, date, setDate, localId, setLocalId: changeLocal, locations, rooms, sessions, availability, available,
  days: currentDays,
  retryDays,
  refreshAvailability: () => { retryDays(); availability.refresh(); sessions.retry(); },
 };
}
