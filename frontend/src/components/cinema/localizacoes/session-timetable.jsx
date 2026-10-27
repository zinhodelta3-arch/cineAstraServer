"use client";

import Link from "next/link";
import { TICKS, pct } from "./data";
import { PosterImg } from "./location-images";
import { AgeBadge } from "./location-ui";
import { useSessionTimetable } from "@/hooks/cinema/localizacoes/use-session-timetable";

export default function Timetable({ loc, day, now }) {
  const { entries, nowLeft } = useSessionTimetable(loc, day, now);

  return (
    <div>
      {/* Eixo das horas (desktop) */}
      <div className="hidden md:grid grid-cols-[240px_1fr] gap-4 mb-2" aria-hidden="true">
        <span />
        <div className="relative h-4">
          {TICKS.map((h) => (
            <span key={h} className="absolute -translate-x-1/2 text-[10px] font-semibold text-muted-foreground" style={{ left: `${pct(h * 60)}%` }}>{h === 24 ? "00h" : `${h}h`}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {entries.map(({ id, movie: m, schedule: s, sessions }) => {
          return (
            <article key={`${day}-${id}`} className="grid md:grid-cols-[210px_1fr] gap-x-3 gap-y-2 items-center border border-border bg-background/40 rounded-lg p-3 transition-colors hover:border-primary/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-[60px] shrink-0 overflow-hidden rounded-md bg-muted"><PosterImg src={m.poster} title={m.title} /></div>
                <div className="min-w-0">
                  <h4 className="f-title uppercase text-sm leading-snug text-card-foreground line-clamp-2">{m.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">{s.room} · {s.fmt} · {m.duration}</p>
                  <div className="mt-1"><AgeBadge age={m.age} /></div>
                </div>
              </div>

              {/* Mobile: horários em botões */}
              <div className="flex flex-wrap gap-2 md:hidden">
                {sessions.map(({ time: t, past, href }) => {
                  return (
                    <Link key={t} href={href} aria-disabled={past} tabIndex={past ? -1 : 0} onClick={(e) => past && e.preventDefault()}
                      className={`px-2.5 py-1.5 rounded-sm border text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${past ? "border-border text-muted-foreground/60 line-through" : "border-primary/50 bg-primary/10 text-primary"}`}>
                      {t}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: blocos na linha do tempo (início e fim de cada sessão) */}
              <div className="relative hidden md:block h-11 rounded-lg bg-muted/30 border border-border overflow-hidden">
                {TICKS.map((h) => <span key={h} className="absolute inset-y-0 border-l border-border/50" style={{ left: `${pct(h * 60)}%` }} aria-hidden="true" />)}
                {sessions.map(({ time: t, past, href, title, left, width }) => {
                  return (
                    <Link key={t} href={href} title={title}
                      aria-disabled={past} tabIndex={past ? -1 : 0} onClick={(e) => past && e.preventDefault()}
                      className={`absolute top-1.5 bottom-1.5 flex items-center justify-center rounded-sm text-[11px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground transition-opacity ${past ? "bg-muted text-muted-foreground/70 line-through pointer-events-none" : "bg-primary text-primary-foreground hover:opacity-85"}`}
                      style={{ left, width }}>
                      {t}
                    </Link>
                  );
                })}
                {nowLeft != null && <span className="absolute inset-y-0 w-0.5 bg-red-500 z-10" style={{ left: `${nowLeft}%` }} aria-hidden="true" />}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
