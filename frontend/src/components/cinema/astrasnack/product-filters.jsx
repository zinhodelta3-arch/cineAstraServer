"use client";

import { Search } from "lucide-react";

export default function ProductFilters({ query, onQueryChange }) {
  return (
    <label className="flex min-h-11 w-full max-w-lg items-center gap-2 rounded-md border border-border bg-card px-3 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        type="search"
        aria-label="Buscar itens e combos"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar itens e combos"
        className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
