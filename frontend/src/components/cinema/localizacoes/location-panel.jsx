"use client";

import { Ticket, Clock3, CalendarDays, MapPin, Navigation, Copy, Check } from "lucide-react";
import { VenueImg } from "./location-images";
import { Button } from "./location-ui";
import Timetable from "./session-timetable";
import { useLocationPanel } from "@/hooks/cinema/localizacoes/use-location-panel";

export default function LocationPanel({ loc }) {
  const { days, day, setDay, now, copied, fullAddress, copy } = useLocationPanel(loc);

  return (
    <div className="reveal bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
      <div className="bulbs" aria-hidden="true" />

      {/* Foto do local */}
      <div className="relative aspect-[16/7] bg-muted">
        <VenueImg src={loc.image} kind={loc.kind} alt={`${loc.type}: ${loc.name}`} className="absolute inset-0" />
        <div className="absolute inset-0 poster-scrim" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <span className="inline-flex items-center rounded-lg bg-background/70 backdrop-blur-md border border-border px-2.5 py-1 text-xs font-bold text-foreground f-title mb-2">{loc.type}</span>
          <h2 className="f-display text-3xl md:text-5xl font-black text-foreground leading-[0.95]">{loc.name}</h2>
        </div>
      </div>

      {/* Endereço em destaque */}
      <div className="grid md:grid-cols-[1fr_auto] gap-5 p-4 md:p-5 items-center">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2"><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Endereço</span>
          <p className="f-title text-xl md:text-2xl text-card-foreground leading-tight">{loc.street}</p>
          <p className="text-sm text-muted-foreground mt-1">{loc.district} · CEP {loc.cep}</p>
          <p className="text-sm text-foreground/80 mt-3 max-w-lg leading-relaxed">{loc.ref}</p>
        </div>
        <div className="flex flex-wrap md:flex-col gap-2">
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name}, ${fullAddress}`)}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:opacity-90 shadow-md shadow-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Navigation className="w-4 h-4 mr-2" aria-hidden="true" /> Como chegar
          </a>
          <Button variant="outline" onClick={copy} aria-live="polite">
            {copied ? <Check className="w-4 h-4 mr-2" aria-hidden="true" /> : <Copy className="w-4 h-4 mr-2" aria-hidden="true" />}
            {copied ? "Endereço copiado" : "Copiar endereço"}
          </Button>
        </div>
      </div>

      <div className="mx-4 md:mx-5 flex flex-wrap items-center gap-x-4 gap-y-2 pb-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-primary" aria-hidden="true" /> Aberto das {loc.hours}</span>
        {loc.perks.map((p) => <span key={p.label} className="inline-flex items-center gap-1.5"><p.icon className="w-4 h-4 text-primary" aria-hidden="true" />{p.label}</span>)}
      </div>

      <div className="tear mx-6 md:mx-8" aria-hidden="true" />

      {/* Programação */}
      <div className="p-4 md:p-5">
        <div className="flex items-stretch gap-3 mb-4">
          <div className="perf-v rounded-sm" aria-hidden="true" />
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-0.5"><Ticket className="w-3.5 h-3.5" aria-hidden="true" /> Sessões neste endereço</span>
            <h3 className="f-display uppercase text-2xl md:text-3xl font-black leading-[0.95] text-foreground">Filmes em cartaz</h3>
          </div>
        </div>

        <div role="tablist" aria-label="Dia da sessão" className="no-scrollbar flex gap-2 mb-4 overflow-x-auto pb-1">
          {days.map((d) => (
            <Button key={d.key} role="tab" aria-selected={day === d.key} variant={day === d.key ? "wine" : "outline"} onClick={() => setDay(d.key)}
              className={`shrink-0 !rounded-lg flex-col !py-1.5 !px-3 ${day === d.key ? "border border-primary/40 !text-primary" : ""}`}>
              <span className="flex items-center capitalize text-xs"><CalendarDays className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />{d.label}</span>
              <span className="text-[11px] font-medium opacity-70 capitalize">{d.date}</span>
            </Button>
          ))}
        </div>

        <div className="max-h-[62vh] overflow-y-auto overscroll-contain pr-1 rounded-lg"><Timetable loc={loc} day={day} now={now} /></div>

        <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
          Cada bloco vai do início ao fim da sessão. {day === 0 && "A linha vermelha marca a hora atual e sessões já iniciadas aparecem riscadas. "}Horários sujeitos a alteração.
        </p>
      </div>
      <div className="perf !rounded-none" aria-hidden="true" />
    </div>
  );
}
