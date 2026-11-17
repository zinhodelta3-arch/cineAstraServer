"use client";

import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MovieFilters({ catalog, item }) {
  const { genres, genre, setGenre, suggestionsId, query, setQuery, suggestions } = catalog;
  const searchId = `${suggestionsId}-${item.value}`;

  return (
    <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
      <div className="min-w-0">
        <label htmlFor={searchId} className="mb-1.5 block text-sm font-semibold">Pesquisar filmes</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden="true" />
          <Input id={searchId} type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)}
            list={`${searchId}-options`} autoComplete="off" placeholder="Qual filme você procura?"
            className="h-11 w-full rounded-md border-border bg-card pl-9 text-base shadow-none sm:text-sm" />
          <datalist id={`${searchId}-options`}>
            {suggestions.map((movie) => <option key={movie.id} value={movie.title} />)}
          </datalist>
        </div>
      </div>
      <div className="min-w-0">
        <label htmlFor={`${searchId}-genre`} className="mb-1.5 block text-sm font-semibold">Gênero</label>
        <div className="relative">
          <select id={`${searchId}-genre`} value={genre} onChange={(event) => setGenre(event.target.value)}
            className="h-11 w-full appearance-none rounded-md border border-border bg-card px-3 pr-9 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm">
            {genres.map(({ value, label }) => <option key={value} value={value}>{value === "Todos" ? "Todos os gêneros" : label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute top-3.5 right-3 size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
