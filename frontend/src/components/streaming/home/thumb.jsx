import { Play, Plus, Check } from "lucide-react";
import { ACCENT } from "./data";
import Art from "./art";
import Badge from "./badge";

export default function Thumb({ movie, onSelect, onPlay, inList, onToggleList, progress }) {
  return (
    <article
      className="group snap-start shrink-0 relative w-[250px] max-w-[calc(100vw-40px)] md:w-[330px] aspect-video rounded-md overflow-hidden bg-card border border-border transition-all duration-300 md:hover:scale-[1.05] hover:z-20 hover:border-primary hover:shadow-2xl hover:shadow-black/60 focus-within:ring-2 focus-within:ring-primary"
    >
      <Art movie={movie} variant="thumb" className="absolute inset-0 size-full object-cover" />
      <button type="button" onClick={() => onSelect(movie)} aria-label={`Detalhes de ${movie.title}`} className="absolute inset-0 size-full cursor-pointer outline-none" />
      <span className="pointer-events-none absolute top-2 left-2 f-display text-[13px] font-black tracking-[0.18em] text-primary bg-black/60 px-1.5 rounded-xs leading-tight">CINEASTRA</span>
      {movie.soon && <Badge className="pointer-events-none absolute top-2 right-2 bg-primary text-primary-foreground">Em breve</Badge>}

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-1.5">
          {!movie.soon && (
            <button type="button" aria-label={`Assistir ${movie.title}`} onClick={() => onPlay(movie)} className="pointer-events-auto size-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Play className="size-4 fill-current" />
            </button>
          )}
          <button type="button" aria-label={`${inList ? "Remover da lista" : "Adicionar à lista"}: ${movie.title}`} onClick={() => onToggleList(movie)} className="pointer-events-auto size-11 shrink-0 rounded-full border-2 border-foreground/60 text-foreground flex items-center justify-center hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {inList ? <Check className="size-4" /> : <Plus className="size-4" />}
          </button>
        </div>
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
          <span className={ACCENT}>CineAstra</span>
          <span className="px-1 border border-muted-foreground/60 rounded-xs">{movie.age}</span>
          <span>{movie.duration}</span>
          <span className="text-muted-foreground">{movie.genre}</span>
        </p>
      </div>

      {progress != null && (
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1.5 bg-background/70" aria-label={`${progress}% assistido`}>
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </article>
  );
}
