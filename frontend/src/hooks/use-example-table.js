"use client";

import { useState } from "react";
import { initialMovies, genres, statuses } from "@/components/admin/tabelaexemplo/data";

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function useExampleTable() {
  const [movies, setMovies] = useState(initialMovies);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const filteredMovies = movies.filter((movie) =>
    (status === "Todos" || movie.status === status) &&
    normalize(`${movie.title} ${movie.genre}`).includes(normalize(query.trim()))
  );

  function createMovie(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const genre = String(form.get("genre"));
    const duration = Number(form.get("duration"));
    const movieStatus = String(form.get("status"));
    if (!title || title.length > 100 || !Number.isInteger(duration) || duration < 1 || duration > 600 || !genres.includes(genre) || !statuses.includes(movieStatus)) {
      setError("Confira o título, o gênero, o status e a duração (de 1 a 600 minutos).");
      return;
    }
    setMovies((current) => [{ id: crypto.randomUUID(), title, genre, duration, status: movieStatus }, ...current]);
    setQuery("");
    setStatus("Todos");
    setCreating(false);
    setError("");
    setMessage(`${title} foi adicionado à demonstração. O registro será removido ao recarregar a página.`);
  }

  function toggleCreating() {
    setCreating((current) => !current);
    setError("");
  }

  return {
    movies, filteredMovies, query, setQuery, status, setStatus,
    creating, toggleCreating, createMovie, message, error,
    showing: movies.filter((movie) => movie.status === "Em cartaz").length,
    upcoming: movies.filter((movie) => movie.status === "Em breve").length,
    clearFilters() { setQuery(""); setStatus("Todos"); },
  };
}
