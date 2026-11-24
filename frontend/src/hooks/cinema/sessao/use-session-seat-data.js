"use client";

import { useEffect, useState } from "react";
import { publicGet, publicAsset } from "@/lib/api/public-api.mjs";

export function useSessionSeatData(sessionId) {
  const [state, setState] = useState({ id: null, loading: true, session: null, error: null });

  useEffect(() => {
    if (!/^[1-9]\d*$/.test(sessionId || "")) return;
    const abort = new AbortController();
    const options = { signal: abort.signal };
    async function load() {
      try {
        const [show, availability] = await Promise.all([
          publicGet(`/sessions/${sessionId}`, options),
          publicGet(`/sessions/${sessionId}/seats`, options),
        ]);
        if (new Date(`${show.data.slice(0, 10)}T${show.horario_inicio}Z`) <= new Date()) throw new Error("Esta sessão já começou. Escolha outro horário.");
        const [film, cinema, room] = await Promise.all([
          publicGet(`/films/${show.id_filme}`, options),
          publicGet(`/locations/${show.id_local}`, options),
          publicGet(`/locations/${show.id_local}/rooms/${show.id_sala}`, options),
        ]);
        if (abort.signal.aborted) return;
        const seatMap = availability.seats.map(seat => ({
          id: String(seat.seatId),
          row: seat.row, number: Number(seat.number), position: seat.position, type: seat.type, availability: seat.availability,
          occupied: seat.availability !== "DISPONIVEL",
          accessible: ["PCD", "OBESO", "IDOSO"].includes(seat.type),
        }));
        const date = show.data.slice(0, 10);
        const session = {
          id: sessionId, movie: {
            id: show.id_filme,
            title: film.titulo, genre: "", duration: `${film.duracao} min`,
            rating: film.classificacao, poster: publicAsset(film.imagem),
          },
          cinema: { name: cinema.nome, room: room.nome, spaceType: cinema.tipo_local },
          localId: show.id_local, roomId: show.id_sala, date,
          dateLabel: new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }),
          time: show.horario_inicio.slice(0, 5), format: room.tipo,
          language: show.idioma, priceCents: Math.round(Number(show.preco_inteira) * 100),
          seats: [], seatMap,
        };
        setState({ id: sessionId, loading: false, session, error: null });
      } catch (error) {
        if (!abort.signal.aborted) setState({ id: sessionId, loading: false, session: null, error: error.message });
      }
    }
    load();
    return () => abort.abort();
  }, [sessionId]);

  if (!/^[1-9]\d*$/.test(sessionId || "")) return { loading: false, session: null, error: "Escolha uma sessão de filme antes de selecionar os assentos." };
  return state.id === sessionId ? state : { loading: true, session: null, error: null };
}
