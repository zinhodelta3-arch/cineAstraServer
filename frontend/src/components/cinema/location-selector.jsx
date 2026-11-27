"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCinemaLocation } from "@/components/providers/cinema-location-provider";
import { usePublicList } from "@/hooks/cinema/home/use-public-list";
import ListStatus from "@/components/cinema/home/list-status";

function CinemaOptions({ location, onSelect }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(location);
  const input = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const locations = usePublicList(`/locations?limit=50&cinema=true${search ? `&q=${encodeURIComponent(search)}` : ""}`);
  const searching = search !== query.trim();
  const options = locations.items;
  const draftId = String(draft?.id_local ?? "");

  return (
    <DialogContent initialFocus={input} className="max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto border border-border bg-popover">
      <DialogHeader className="border-b border-dashed border-border pb-3 pr-9">
        <DialogTitle className="text-xl font-bold">Escolher cinema</DialogTitle>
        <DialogDescription>Veja sessões e produtos do AstraSnack disponíveis na unidade escolhida.</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (draft) onSelect(draft); }}>
        <label className="block space-y-2 text-sm font-semibold">
          <span>Buscar cinema</span>
          <span className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
            <Search className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <input ref={input} type="search" value={query} maxLength={150} onChange={event => setQuery(event.target.value)}
              placeholder="Nome, cidade ou bairro" className="w-full min-w-0 bg-transparent py-2 outline-none" />
          </span>
        </label>
        <label className="block space-y-2 text-sm font-semibold">
          <span>Cinema</span>
          <select value={draftId} disabled={searching || !options.length && !draft}
            onChange={event => setDraft(options.find(row => String(row.id_local) === event.target.value) ?? null)}
            className="block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <option value="">Selecione uma unidade</option>
            {draft && !options.some(row => String(row.id_local) === draftId) && <option value={draftId}>{draft.nome} — {draft.cidade}</option>}
            {options.map(row => <option key={row.id_local} value={row.id_local}>{row.nome} — {row.cidade}, {row.estado}</option>)}
          </select>
        </label>
        {!searching && (locations.loading || locations.error || locations.cursor || !options.length) && (
          <ListStatus list={locations} empty="Nenhum cinema encontrado." more="Mostrar mais cinemas" />
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {location && <Button type="button" variant="ghost" onClick={() => onSelect(null)}>Ver todos os cinemas</Button>}
          <Button type="submit" disabled={!draft || searching}>Confirmar cinema</Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default function LocationSelector() {
  const selection = useCinemaLocation();
  const [open, setOpen] = useState(false);
  if (!selection) return null;
  const { location, selectCinema } = selection;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={location ? `Trocar cinema: ${location.nome}` : "Escolher cinema"}
        title={location?.nome || "Escolher cinema"}
        className="flex min-h-9 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md text-primary sm:max-w-32 sm:px-2 lg:max-w-60 lg:justify-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden truncate text-xs font-bold md:block">{location?.nome || "Escolher cinema"}</span>
        <ChevronDown className="hidden size-3 shrink-0 lg:block" aria-hidden="true" />
      </DialogTrigger>
      {open && <CinemaOptions location={location} onSelect={row => { selectCinema(row); setOpen(false); }} />}
    </Dialog>
  );
}
