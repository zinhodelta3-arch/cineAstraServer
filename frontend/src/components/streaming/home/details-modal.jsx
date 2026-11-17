"use client";

import { useRef, useState } from "react";
import { Clock3, Play, X, Bookmark, BookmarkCheck } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Art from "./art";
import Button from "./button";
import ticket from "../../cinema/ticket.module.css";
import styles from "./details-modal.module.css";

export default function DetailsModal({ movie, open, onOpenChange, returnFocus, onPlay, inList = false, onToggleList, progress }) {
  const closeButton = useRef(null);
  const [favoriteChange, setFavoriteChange] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const saved = favoriteChange ?? inList;

  async function toggleFavorite() {
    setSaving(true);
    setError(false);
    try {
      if (await onToggleList(movie, !saved)) setFavoriteChange(!saved);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} initialFocus={closeButton} finalFocus={returnFocus} className={`${styles.dialog} motion-reduce:animate-none`}>
      <div className={styles.heading}>
        <DialogTitle className={`${styles.title} f-display`}>{movie.title}</DialogTitle>
        <DialogClose ref={closeButton} aria-label="Fechar detalhes do filme" className={styles.close}>
          <X className="size-6" aria-hidden="true" />
        </DialogClose>
      </div>

      <div className={styles.body}>
        <div className={styles.art} aria-hidden="true">
          <Art movie={movie} variant="backdrop" showTitle={false} className="size-full object-cover" />
        </div>
        <div className={styles.information}>
          <p className="text-sm font-semibold text-foreground">{movie.soon ? "Em breve · " : ""}{movie.genre}</p>
          <div className="my-4 flex items-center gap-x-4 gap-y-2 text-sm text-muted-foreground flex-wrap">
            {movie.releaseDate && <span>{movie.releaseDate.slice(0, 4)}</span>}
            <span className="flex items-center gap-1"><Clock3 className="size-4 shrink-0 opacity-70" aria-hidden="true" />{movie.duration}</span>
            <span className="px-2 py-0.5 rounded-xs border border-border text-xs font-bold">{movie.age === "Livre" ? "Livre" : movie.age ? `${movie.age} anos` : "Classificação a confirmar"}</span>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">{movie.synopsis}</DialogDescription>
          {movie.director && <p className="mt-4 text-xs italic text-muted-foreground">Direção: {movie.director}</p>}
        </div>
        {(!movie.soon || onToggleList) && <>
          <div className={`${ticket.tear} ${styles.tear}`} aria-hidden="true" />
          <div className={`${ticket.stub} ${styles.stub}`}>
            <div className={styles.actions}>
            {!movie.soon && <Button onClick={() => onPlay(movie)}>
              <Play className="size-4 mr-2 fill-current" aria-hidden="true" />{progress > 0 ? "Continuar" : "Assistir"}
            </Button>}
            {onToggleList && <Button variant="outline" disabled={saving} onClick={toggleFavorite}>
              {saved ? <BookmarkCheck className="size-4 mr-2" aria-hidden="true" /> : <Bookmark className="size-4 mr-2" aria-hidden="true" />}
              {saved ? "Remover da lista" : "Adicionar à lista"}
            </Button>}
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-foreground">Não foi possível atualizar sua lista. Tente novamente.</p>}
          </div>
        </>}
      </div>
    </DialogContent>
  </Dialog>;
}
