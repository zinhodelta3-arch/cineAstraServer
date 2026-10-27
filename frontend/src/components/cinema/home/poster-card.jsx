"use client";

import { Film, Ticket, CalendarDays, Flame } from "lucide-react";
import { Barcode, SmartImg } from "./home-ui";

const AGE_STYLES = {
  Livre: "bg-emerald-600 text-white",
  "10": "bg-sky-500 text-white",
  "12": "bg-yellow-400 text-black",
  "14": "bg-orange-500 text-white",
  "16": "bg-red-600 text-white",
  "18": "bg-black text-white border border-border",
};

function AgeBadge({ age }) {
  return (
    <span aria-label={`Classificação ${age}`} className={`inline-flex min-w-[28px] h-6 px-1.5 items-center justify-center rounded-md text-xs font-bold ${AGE_STYLES[age] || "bg-muted text-foreground"}`}>
      {age}
    </span>
  );
}

export default function PosterCard({ movie, onSelectMovie, soon = false }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectMovie(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectMovie(movie))}
      style={{ "--n": "50%" }}
      className="ticket ticket-v group h-full bg-card border border-border cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none flex flex-col"
    >
      <div className="perf !rounded-none" aria-hidden="true" />
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <SmartImg src={movie.poster} alt={`Pôster de ${movie.title}`} title={movie.title} icon={Film} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 poster-scrim" aria-hidden="true" />
        {soon ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-bold uppercase text-white shadow-lg f-title">
            <Flame className="w-3.5 h-3.5" aria-hidden="true" /> Em breve
          </span>
        ) : (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-lg bg-background/70 backdrop-blur-md border border-border px-2.5 py-1.5 text-xs font-bold text-foreground f-title">
            No catálogo
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-end justify-center p-4">
          <span className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            <Ticket className="w-4 h-4 mr-1.5" aria-hidden="true" /> {soon ? "Consultar sessões" : "Consultar sessões"}
          </span>
        </div>
      </div>
      <div className="perf !rounded-none" aria-hidden="true" />

      <div className="px-3 pt-3 pb-2">
        <span className="text-xs font-semibold text-primary block mb-1">{movie.duration}</span>
        <h3 className="f-title uppercase text-sm leading-tight text-card-foreground line-clamp-2 min-h-[2.25rem] group-hover:text-primary transition-colors">{movie.title}</h3>
      </div>

      <div className="tear mx-3" aria-hidden="true" />

      <div className="px-3 py-2.5 flex-grow flex flex-col justify-between gap-3">
        {soon ? (
          <p className="text-xs font-semibold text-foreground flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{movie.release}</p>
        ) : (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Consultar horários disponíveis</p>
            <div className="flex gap-1.5 flex-wrap">
              {movie.sessions.slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-1 rounded-sm bg-secondary/20 border border-secondary/40 text-[11px] font-bold text-foreground group-hover:text-primary">{t}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <Barcode seed={movie.title.length} className="h-6 opacity-60" />
          <AgeBadge age={movie.age} />
        </div>
      </div>
    </div>
  );
}
