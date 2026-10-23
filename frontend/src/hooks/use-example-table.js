"use client";

import { useState } from "react";
import { initialMovies, genres, statuses } from "@/components/admin/tabelaexemplo/data";

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function useExampleTable() {
  const [movies, setMovies] = useState(initialMovies);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const filteredMovies = movies.filter((movie) =>
    (status === "Todos" || movie.status === status) &&
    normalize(`${movie.title} ${movie.genre}`).includes(normalize(query.trim()))
  );

  function saveMovie(event) {
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
    const values = { title, genre, duration, status: movieStatus };
    const editing = modal?.type === "edit";
    if (editing) {
      setMovies((current) => current.map((movie) => movie.id === modal.movie.id ? { ...movie, ...values } : movie));
    } else {
      setMovies((current) => [{ id: crypto.randomUUID(), ...values }, ...current]);
    }
    setQuery("");
    setStatus("Todos");
    setModal(null);
    setError("");
    setMessage(`${title} foi ${editing ? "atualizado" : "adicionado"} na demonstração. As alterações não são salvas ao recarregar a página.`);
  }

  function openModal(type, movie = null) {
    setModal({ type, movie });
    setError("");
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  function removeMovie() {
    if (modal?.type !== "remove") return;
    setMovies((current) => current.filter((movie) => movie.id !== modal.movie.id));
    setMessage(`${modal.movie.title} foi removido da demonstração.`);
    closeModal();
  }

  return {
    movies, filteredMovies, query, setQuery, status, setStatus,
    modal, openModal, closeModal, saveMovie, removeMovie, message, error,
    showing: movies.filter((movie) => movie.status === "Em cartaz").length,
    upcoming: movies.filter((movie) => movie.status === "Em breve").length,
    clearFilters() { setQuery(""); setStatus("Todos"); },
  };
}
