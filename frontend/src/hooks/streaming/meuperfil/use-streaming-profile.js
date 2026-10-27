"use client";

import { useState, useEffect } from "react";
import { STORAGE_KEY, INITIAL_LIST, INITIAL_TRAILERS, FILMS, byId } from "@/components/streaming/meuperfil/data";

export default function useStreamingProfile() {
  const [profile, setProfile] = useState({ name: "Cinéfilo", avatar: { type: "preset", id: "film" } });
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState(INITIAL_LIST);
  const [trailers, setTrailers] = useState(INITIAL_TRAILERS);
  const [trailerOpen, setTrailerOpen] = useState(null);
  const [tab, setTab] = useState("all");

  /* carrega o perfil salvo */
  // Browser-only hydration preserves the initial SSR render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.name && saved?.avatar) setProfile(saved);
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveProfile = (next) => {
    setProfile(next);
    setEditing(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleList = (m) => setList((p) => (p.includes(m.id) ? p.filter((id) => id !== m.id) : [...p, m.id]));

  const openTrailer = (m) => {
    setTrailerOpen(m);
    setTrailers((p) => [{ id: m.id, when: "Hoje" }, ...p.filter((t) => t.id !== m.id)]);
  };

  const myListFilms = byId(list);
  const watchedTrailers = trailers.map((t) => ({ ...FILMS.find((f) => f.id === t.id), when: t.when })).filter((f) => f.id);
  const show = (key) => tab === "all" || tab === key;


  const openEditor = () => setEditing(true);
  const closeEditor = () => setEditing(false);
  const changeTrailerOpen = (o) => !o && setTrailerOpen(null);
  return { profile, editing, setEditing, list, trailers, trailerOpen, tab, setTab, saveProfile, toggleList, openTrailer, myListFilms, watchedTrailers, show, openEditor, closeEditor, changeTrailerOpen };
}
