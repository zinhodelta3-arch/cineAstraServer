"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MovieFilters({ catalog, item }) {
  const { genres, genre, setGenre, suggestionsId, query, setQuery, suggestions } = catalog;
  return (
              <div className="flex flex-col justify-between gap-6 pb-6 pt-7 lg:flex-row lg:items-start">
                <div className="flex max-w-full flex-wrap gap-x-1 gap-y-2 lg:max-w-[65%]" role="group" aria-label="Filtrar por gênero">
                  {genres.map((name) => (
                    <Button key={name} type="button" variant="ghost" size="sm" aria-pressed={genre === name} onClick={() => setGenre(name)}
                      className={`h-8 rounded-full border px-3.5 text-xs font-semibold shadow-none ${genre === name ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-transparent hover:text-foreground"}`}>
                      {name}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full lg:w-[290px] lg:shrink-0">
                  <label htmlFor={`${suggestionsId}-${item.value}`} className="sr-only">Pesquisar filmes em {item.label.toLowerCase()}</label>
                  <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input id={`${suggestionsId}-${item.value}`} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                    list={`${suggestionsId}-options-${item.value}`} autoComplete="off" placeholder="Qual filme você procura?"
                    className="h-10 rounded-full border-border bg-background/50 pl-9 pr-3 text-xs shadow-none" />
                  <datalist id={`${suggestionsId}-options-${item.value}`}>
                    {suggestions.map((movie) => <option key={movie.id} value={movie.title} />)}
                  </datalist>
                </div>
              </div>
  );
}
