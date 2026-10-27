"use client";

import { MapPin, Search, X } from "lucide-react";
import { Button } from "./location-ui";
import LocationItem from "./location-item";

export default function LocationList({ locations }) {
  const { selectedId, setSelectedId, searchTerm, setSearchTerm, filteredLocations } = locations;
  return (
          <div className="lg:sticky lg:top-20 space-y-3">
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <label htmlFor="cinema-search" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Buscar local
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <input
                  id="cinema-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nome, cidade, bairro ou endereço..."
                  aria-label="Pesquisar cinemas por nome, cidade, bairro ou endereço"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Limpar pesquisa"
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                {filteredLocations.length} {filteredLocations.length === 1 ? "local encontrado" : "locais encontrados"}
              </p>
            </div>

            {filteredLocations.length > 0 ? (
              <div className="space-y-2 lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-2 overscroll-contain">
                {filteredLocations.map((loc) => (
                  <LocationItem
                    key={loc.id}
                    loc={loc}
                    selected={loc.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <MapPin className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <h2 className="f-title text-lg uppercase text-foreground">Nenhum local encontrado</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente pesquisar por outra cidade, bairro ou nome de cinema.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm("")}>
                  Limpar pesquisa
                </Button>
              </div>
            )}
          </div>
  );
}
