"use client";

import { MapPin, ChevronRight } from "lucide-react";

export default function LocationItem({ loc, selected, onSelect }) {
  return (
    <button
      type="button" onClick={() => onSelect(loc.id)} aria-pressed={selected} style={{ "--n": "50%" }}
      className={`ticket group w-full text-left grid grid-cols-[92px_1fr] min-h-[112px] rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:shadow-md ${selected ? "bg-secondary/25 border-primary shadow-sm" : "bg-card border-border hover:border-primary/60"}`}
    >
      <div className="relative bg-muted overflow-hidden">
        <div className="flex h-full items-center justify-center text-primary/60" aria-hidden="true"><MapPin className="size-8" /></div>
        <div className="absolute inset-y-0 right-0 w-3 perf-v" aria-hidden="true" />
      </div>
      <div className="p-3 min-w-0">
        <span className="text-xs font-semibold text-primary block mb-1">{loc.type}</span>
        <h3 className="f-title uppercase text-base leading-snug text-card-foreground mb-1">{loc.name}</h3>
        <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-primary" aria-hidden="true" />
          <span>{loc.street}<br />{loc.district}</span>
        </p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/70 text-xs text-muted-foreground">
          <span>Consultar salas e sessões</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${selected ? "text-primary translate-x-0.5" : ""}`} aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}
