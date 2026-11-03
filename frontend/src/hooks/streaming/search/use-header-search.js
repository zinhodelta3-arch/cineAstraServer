"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStreamingFilms, streamingMovie } from "@/lib/api/streaming-data.mjs";
import { normalizeSearch, searchStreamingFilms } from "@/lib/streaming-search.mjs";

export default function useHeaderSearch() {
  const params = useSearchParams();
  const currentQuery = (params.get("q") || "").slice(0, 200);
  const [query, setQuery] = useState(currentQuery);
  const [catalog, setCatalog] = useState([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef(null);

  useEffect(() => { setQuery(currentQuery); setOpen(false); }, [currentQuery]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loadStreamingFilms(controller.signal).then((films) => {
      if (!controller.signal.aborted) setCatalog(films.map(streamingMovie));
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause.message || "Não foi possível carregar os filmes.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, revision]);

  const searching = Boolean(normalizeSearch(query));
  const films = searching ? searchStreamingFilms(catalog, query, { titleOnly: true }) : [];
  return {
    query, films, input, open, setOpen, loading, error, searching,
    change: (event) => setQuery(event.target.value),
    retry: () => setRevision((value) => value + 1),
    close: () => setOpen(false),
    clear: () => { setQuery(""); input.current?.focus(); },
  };
}
