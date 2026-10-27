"use client";

import { Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PosterImage from "./poster-image";
import { AgeRating } from "./movie-ui";
import { SECTIONS, durationLabel } from "./movie-utils";
import styles from "./filmes.module.css";

export default function MovieDetailsDialog({ selectedMovie, onOpenChange }) {
  return (
      <Dialog open={Boolean(selectedMovie)} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg bg-card sm:max-w-[700px]">
          {selectedMovie && (
            <div className="grid gap-6 sm:grid-cols-[170px_1fr]">
              <div className="mx-auto aspect-[2/3] w-36 overflow-hidden rounded-sm sm:w-full"><PosterImage key={selectedMovie.id} movie={selectedMovie} className="h-full w-full object-cover" eager /></div>
              <div>
                <DialogHeader className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{SECTIONS.find((item) => item.value === selectedMovie.status)?.label}</p>
                  <DialogTitle className={`${styles.display} pr-4 text-4xl font-bold leading-tight`}>{selectedMovie.title}</DialogTitle>
                  <DialogDescription className="mt-3 text-sm leading-relaxed">{selectedMovie.synopsis}</DialogDescription>
                </DialogHeader>
                <div className="my-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <AgeRating age={selectedMovie.age} /><span>{durationLabel(selectedMovie.duration)}</span><span>{selectedMovie.genres.join(" · ")}</span>
                </div>
                <div className={`${styles.tear} pt-4`}>
                  <p className="flex items-center gap-2 text-sm font-semibold"><Ticket className="size-4 text-primary" aria-hidden="true" />{selectedMovie.status === "em-breve" ? "Programação em breve" : "Sessões de demonstração"}</p>
                  {selectedMovie.sessions.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{selectedMovie.sessions.map((time) => <span key={time} className="border border-border bg-muted/40 px-3 py-2 text-xs font-bold">{time}</span>)}</div> : <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Os horários aparecerão aqui quando a programação estiver disponível.</p>}
                  <p className="mt-3 text-[11px] text-muted-foreground">{selectedMovie.formats.join(" · ")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
  );
}
