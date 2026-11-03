"use client";

import { Clock3, Play, X, Bookmark, BookmarkCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ACCENT } from "./data";
import Art from "./art";
import Barcode from "./barcode";
import Badge from "./badge";
import Button from "./button";
import styles from "./details-modal.module.css";

export default function DetailsModal({ movie, onClose, onPlay, inList, onToggleList, catalog, progress }) {
  const similar = catalog.filter((m) => m.id !== movie.id && m.age === movie.age).length;

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent showCloseButton={false} className={`${styles.dialog} ticket [--n:50%]`}>
      <div className={styles.heading}>
        <DialogTitle className={`${styles.title} f-display`}>{movie.title}</DialogTitle>
        <button type="button" onClick={onClose} aria-label="Fechar detalhes do filme" className={styles.close}>
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.information}>
          <Badge className={`max-w-full whitespace-normal bg-primary/10 border border-primary/30 ${ACCENT}`}>
            {movie.soon ? "Em breve" : "Filme"} · {movie.genre}
          </Badge>
          <div className="my-5 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {movie.year && <span>{movie.year}</span>}
            <span className="flex items-center gap-1"><Clock3 className="size-4 shrink-0 opacity-70" aria-hidden="true" />{movie.duration}</span>
            <span className="px-2 py-0.5 rounded-xs border border-border text-[11px] font-bold">{movie.age === "Livre" ? "Livre" : `${movie.age} anos`}</span>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">{movie.synopsis}</DialogDescription>
          {movie.director && <p className="mt-4 text-xs italic text-muted-foreground">Direção: {movie.director}</p>}
          <div className={styles.actions}>
            {!movie.soon && <Button onClick={() => { onClose(); onPlay(movie); }}>
              <Play className="size-4 mr-2 fill-current" aria-hidden="true" />{progress?.[movie.id] ? "Continuar" : "Assistir"}
            </Button>}
            <Button variant="outline" onClick={() => onToggleList(movie)}>
              {inList ? <BookmarkCheck className="size-4 mr-2" aria-hidden="true" /> : <Bookmark className="size-4 mr-2" aria-hidden="true" />}
              {inList ? "Remover da lista" : movie.soon ? "Lembrar-me" : "Minha lista"}
            </Button>
          </div>
        </div>

        <div className={styles.stub}>
          <div className={styles.poster}><Art movie={movie} variant="poster" className="size-full object-cover" /></div>
          <div className={styles.stubCopy}>
            <p className="text-xs font-bold text-card-foreground">{similar > 0 ? `${similar} outros filmes no catálogo` : "CineAstra Streaming"}</p>
            <Barcode seed={movie.title.length} />
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
