"use client";
import { useEffect, useRef, useState } from 'react';
import { usePublicList } from './use-public-list';
import { publicGet } from '@/lib/api/public-api.mjs';
export function useHomeSessions(movie) {
 const [date, setDate] = useState(''), [localId, setLocalId] = useState('');
 const [days, setDays] = useState({ key: null, items: [], loading: false, error: null });
 const locations = usePublicList('/locations?limit=100');
 const rooms = usePublicList(localId ? `/locations/${localId}/rooms?limit=100` : null);
 const sessions = usePublicList(localId && date ? `/sessions?localId=${localId}&date=${date}&limit=100` : null);
 const dialogRef = useRef(null);
 useEffect(() => {const dialog = dialogRef.current, previous = document.activeElement; dialog.showModal(); return () => {dialog.close(); previous?.focus();};}, []);
 useEffect(() => {
  if (!localId) return;
  const abort = new AbortController();
  publicGet(`/films/${movie.id}/available-days?localId=${localId}`, { signal: abort.signal })
   .then(data => { if (!abort.signal.aborted) setDays({ key: localId, items: data.days, loading: false, error: null }); })
   .catch(error => { if (!abort.signal.aborted) setDays({ key: localId, items: [], loading: false, error: error.message }); });
  return () => abort.abort();
 }, [movie.id, localId]);
 const currentDays = days.key === localId ? days : { items: [], loading: Boolean(localId), error: null };
 const changeLocal = id => { setLocalId(id); setDate(''); };
 return { dialogRef, date, setDate, localId, setLocalId: changeLocal, locations, rooms, sessions, days: currentDays, available: sessions.items.filter(s => s.id_filme === movie.id && new Date(`${s.data.slice(0,10)}T${s.horario_inicio}Z`) > new Date()).map(s => ({ ...s, roomName: rooms.items.find(r => r.id_sala === s.id_sala)?.nome || 'Sala a confirmar' })) };
}
