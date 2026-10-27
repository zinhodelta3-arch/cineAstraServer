"use client";

import { useId, useMemo, useState } from "react";
import { MOVIES } from "@/components/cinema/filmes/movies";
import { SECTIONS, normalize } from "@/components/cinema/filmes/movie-utils";

export function useCinemaMovies() {
  const [section, setSection] = useState("em-cartaz");
  const [cinema, setCinema] = useState("todos");
  const [genre, setGenre] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const suggestionsId = useId();

  const availableMovies = useMemo(() => MOVIES.filter((movie) => movie.status === section &&
    (cinema === "todos" || movie.cinemas.includes(cinema))), [section, cinema]);
  const genres = useMemo(() => ["Todos", ...new Set(availableMovies.flatMap((movie) => movie.genres))], [availableMovies]);
  const visibleMovies = useMemo(() => availableMovies.filter((movie) =>
    (genre === "Todos" || movie.genres.includes(genre)) && normalize(movie.title).includes(normalize(query))), [availableMovies, genre, query]);
  const suggestions = availableMovies.filter((movie) => genre === "Todos" || movie.genres.includes(genre));
  const activeLabel = SECTIONS.find((item) => item.value === section)?.label;

  function changeSection(value) {
    setSection(value);
    setGenre("Todos");
    setQuery("");
  }

  function changeCinema(value) {
    if (!value) return;
    setCinema(value);
    setGenre("Todos");
  }

  function clearFilters() {
    setGenre("Todos");
    setQuery("");
  }

  function changeDetailsOpen(open) {
    if (!open) setSelectedMovie(null);
  }

  return {
    section, cinema, genre, query, selectedMovie, suggestionsId,
    genres, visibleMovies, suggestions, activeLabel,
    setGenre, setQuery, setSelectedMovie, changeDetailsOpen,
    changeSection, changeCinema, clearFilters,
  };
}
