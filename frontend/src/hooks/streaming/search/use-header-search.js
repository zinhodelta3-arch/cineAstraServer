"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStreamingFilms, streamingMovie } from "@/lib/api/streaming-data.mjs";
import { normalizeSearch, searchStreamingFilms } from "@/lib/streaming-search.mjs";

export default function useHeaderSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const currentQuery = (params.get("q") || "").slice(0, 200);
  const [query, setQuery] = useState(currentQuery);
  const [term, setTerm] = useState(normalizeSearch(currentQuery));
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const input = useRef(null);
  const suggestions = useRef(null);
  const normalized = normalizeSearch(query);
  const searching = Boolean(normalized);
  const hasTerm = Boolean(term);

  useEffect(() => {
    setQuery(currentQuery);
    setOpen(false);
  }, [currentQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(normalized), 250);
    return () => clearTimeout(timer);
  }, [normalized]);

  useEffect(() => {
    if (!open || !hasTerm) return;
    const controller = new AbortController();
    loadStreamingFilms(controller.signal).then((films) => {
      if (!controller.signal.aborted) setResult({ revision, catalog: films.map(streamingMovie) });
    }).catch((cause) => {
      if (!controller.signal.aborted) setResult({ revision, error: cause.message || "Não foi possível carregar os filmes." });
    });
    return () => controller.abort();
  }, [open, revision, hasTerm]);

  const current = result?.revision === revision ? result : null;
  const loading = searching && (normalized !== term || !current);
  const films = searching && !loading && current.catalog
    ? searchStreamingFilms(current.catalog, term, { titleOnly: true })
    : [];
  const resultsHref = "/streaming/busca?q=" + encodeURIComponent(query.trim());

  function submit(event) {
    event.preventDefault();
    if (!searching) return;
    setOpen(false);
    router.push(resultsHref);
  }

  function focusSuggestion(event) {
    if (event.key !== "ArrowDown") return;
    const first = suggestions.current?.querySelector("button");
    if (!first) return;
    event.preventDefault();
    first.focus();
  }

  return {
    query, films, input, suggestions, open, setOpen, loading, error: searching ? current?.error : "",
    searching, submit, resultsHref, focusSuggestion,
    change: (event) => setQuery(event.target.value),
    retry: () => setRevision((value) => value + 1),
    close: () => setOpen(false),
    clear: () => { setQuery(""); input.current?.focus(); },
  };
}
