import useEscape from "@/hooks/streaming/home/use-escape";
import { Star, Clock3, Play, X, Bookmark, BookmarkCheck } from "lucide-react";
import { ACCENT, PROGRESS, RELEASED } from "./data";
import Art from "./art";
import Barcode from "./barcode";
import Badge from "./badge";
import Button from "./button";

export default function DetailsModal({ movie, onClose, onPlay, inList, onToggleList }) {
  useEscape(onClose);
  const similar = RELEASED.filter((m) => m.id !== movie.id && m.genre === movie.genre).length;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Detalhes de ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ticket [--n:50%] w-full max-w-3xl grid md:grid-cols-[1fr_220px] bg-card border border-border rounded-xl shadow-2xl">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <Badge className={`bg-primary/10 border border-primary/30 ${ACCENT}`}>{movie.soon ? "Em breve" : "Filme"} · {movie.genre}</Badge>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground md:hidden"><X className="size-5" /></button>
          </div>
          <h3 className="f-display text-4xl md:text-5xl font-black text-card-foreground mb-4 leading-none">{movie.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5 flex-wrap">
            {!movie.soon && <span className={`flex items-center font-bold ${ACCENT}`}><Star className="size-4 fill-current mr-1" aria-hidden="true" />{movie.match}% relevante</span>}
            <span>{movie.year}</span>
            <span className="flex items-center"><Clock3 className="size-4 mr-1 opacity-70" aria-hidden="true" />{movie.duration}</span>
            <span className="px-2 py-0.5 rounded-xs border border-border text-[11px] font-bold">{movie.age === "Livre" ? "Livre" : `${movie.age} anos`}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{movie.synopsis}</p>
          {!movie.soon && <p className="text-xs italic text-muted-foreground mb-6">Elenco: {movie.cast}</p>}
          <div className="flex gap-3 flex-wrap mt-4">
            {!movie.soon && (
              <Button onClick={() => { onClose(); onPlay(movie); }}>
                <Play className="size-4 mr-2 fill-current" aria-hidden="true" /> {PROGRESS[movie.id] ? "Continuar" : "Assistir"}
              </Button>
            )}
            <Button variant="outline" onClick={() => onToggleList(movie)}>
              {inList ? <BookmarkCheck className="size-4 mr-2" aria-hidden="true" /> : <Bookmark className="size-4 mr-2" aria-hidden="true" />}
              {inList ? "Remover da lista" : movie.soon ? "Lembrar-me" : "Minha lista"}
            </Button>
          </div>
        </div>

        <div className="tear tear-v md:border-t-0 bg-secondary/15 p-6 flex flex-col justify-between gap-6">
          <button type="button" onClick={onClose} aria-label="Fechar" className="self-end p-1 text-muted-foreground hover:text-foreground hidden md:block"><X className="size-5" /></button>
          <div className="aspect-[2/3] w-full overflow-hidden rounded-md border border-border">
            <Art movie={movie} variant="poster" className="size-full object-cover" />
          </div>
          <p className="text-xs font-bold text-card-foreground">{similar > 0 ? `${similar} filme(s) parecido(s)` : "Original CineAstra"}</p>
          <Barcode seed={movie.title.length} />
        </div>
      </div>
    </div>
  );
}
