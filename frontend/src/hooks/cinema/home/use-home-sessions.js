"use client";
import { useEffect, useRef, useState } from 'react';
import { usePublicList } from './use-public-list';
export function useHomeSessions(movie) {
 const today = new Date().toISOString().slice(0,10);
 const [date, setDate] = useState(today), [localId, setLocalId] = useState('');
 const locations = usePublicList('/locations?limit=100');
 const rooms = usePublicList(localId ? `/locations/${localId}/rooms?limit=100` : null);
 const sessions = usePublicList(localId && date ? `/sessions?localId=${localId}&date=${date}&limit=100` : null);
 const dialogRef = useRef(null);
 useEffect(() => {const dialog = dialogRef.current, previous = document.activeElement; dialog.showModal(); return () => {dialog.close(); previous?.focus();};}, []);
 return { dialogRef, today, date, setDate, localId, setLocalId, locations, rooms, sessions, available: sessions.items.filter(s => s.id_filme === movie.id && new Date(`${s.data.slice(0,10)}T${s.horario_inicio}Z`) > new Date()).map(s => ({ ...s, roomName: rooms.items.find(r => r.id_sala === s.id_sala)?.nome || 'Sala a confirmar' })) };
}
