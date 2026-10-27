"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { LOCATIONS } from "@/components/cinema/localizacoes/data";

export function useCinemaLocations() {
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const panelRef = useRef(null);
  const selected = LOCATIONS.find((l) => l.id === selectedId);

  const filteredLocations = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    if (!term) return LOCATIONS;

    return LOCATIONS.filter((loc) =>
      [loc.name, loc.type, loc.street, loc.district, loc.cep, loc.ref]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term))
    );
  }, [searchTerm]);

  /* No celular o painel fica abaixo da lista: rola até ele ao escolher um cinema */
  useEffect(() => {
    if (!selected || window.innerWidth >= 1024) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, [selected]);

  return { selectedId, setSelectedId, searchTerm, setSearchTerm, panelRef, selected, filteredLocations };
}
