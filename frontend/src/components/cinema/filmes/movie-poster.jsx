"use client";

import { Clock3, Ticket } from "lucide-react";
import PosterImage from "./poster-image";
import { AgeRating, Barcode } from "./movie-ui";
import { durationLabel } from "./movie-utils";
import styles from "./filmes.module.css";

export default function MoviePoster({ movie, onSelect, index }) {
  return (
    <article className="group min-w-0">
      <button type="button" onClick={() => onSelect(movie)} aria-label={`Ver detalhes de ${movie.title}`}
        className={`${styles.posterTicket} block h-full w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
        <div className={styles.perforation} aria-hidden="true" />
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <PosterImage movie={movie} eager={index < 4} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
          <div className={styles.posterScrim} aria-hidden="true" />
          {movie.status !== "em-cartaz" && <span className={`${styles.titleFont} absolute left-3 top-3 rounded-md border border-primary/30 bg-secondary px-2.5 py-1.5 text-[11px] font-semibold uppercase text-secondary-foreground shadow-sm`}>
            {movie.status === "pre-venda" ? "Pré-venda" : "Em breve"}
          </span>}
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-background/90 via-background/40 to-transparent p-4 pt-16 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none" aria-hidden="true">
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground"><Ticket className="size-4" />Ver detalhes</span>
          </div>
        </div>
        <div className={styles.perforation} aria-hidden="true" />
        <div className="px-3 pt-4 sm:px-4">
          <p className="truncate text-[11px] font-semibold text-primary">{movie.genres.join(" · ")}</p>
          <h2 className={`${styles.titleFont} mt-1 line-clamp-2 min-h-[3rem] text-lg font-semibold uppercase leading-6 text-card-foreground transition-colors group-hover:text-primary sm:text-xl`}>{movie.title}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock3 className="size-3" aria-hidden="true" />{durationLabel(movie.duration)}</p>
        </div>
        <div className={`${styles.tear} mx-3 mt-4 sm:mx-4`} aria-hidden="true" />
        <div className="px-3 pb-4 pt-3 sm:px-4">
          <p className="mb-2 text-[11px] text-muted-foreground">{movie.sessions.length ? "Próximas sessões" : "Sessões em breve"}</p>
          <div className="flex min-h-7 flex-wrap gap-1.5">
            {movie.sessions.slice(0, 3).map((time) => <span key={time} className="rounded-sm border border-secondary/40 bg-secondary/20 px-2 py-1 text-[10px] font-bold text-foreground">{time}</span>)}
            {!movie.sessions.length && <span className="text-[11px] text-foreground">Horários a confirmar</span>}
          </div>
          <div className="mt-4 flex items-end justify-between gap-2"><Barcode seed={movie.title.length} /><AgeRating age={movie.age} /></div>
        </div>
      </button>
    </article>
  );
}
