import { Play, Plus, Check } from "lucide-react";
import { ACCENT } from "./data";
import Art from "./art";
import Badge from "./badge";

export default function Thumb({ movie, onSelect, onPlay, inList, onToggleList, progress }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(movie))}
      aria-label={movie.title}
      className="group snap-start shrink-0 relative w-[250px] md:w-[330px] aspect-video rounded-md overflow-hidden bg-card border border-border cursor-pointer transition-all duration-300 hover:scale-[1.05] hover:z-20 hover:border-primary hover:shadow-2xl hover:shadow-black/60 focus-visible:ring-2 focus-visible:ring-primary outline-hidden"
    >
      <Art movie={movie} variant="thumb" className="absolute inset-0 size-full object-cover" />
      <span className="absolute top-2 left-2 f-display text-[13px] font-black tracking-[0.18em] text-primary bg-black/60 px-1.5 rounded-xs leading-tight">CINEASTRA</span>
      {movie.soon && <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">Em breve</Badge>}

      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-1.5">
          {!movie.soon && (
            <button type="button" aria-label={`Assistir ${movie.title}`} onClick={(e) => { e.stopPropagation(); onPlay(movie); }} className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90">
              <Play className="size-4 fill-current" />
            </button>
          )}
          <button type="button" aria-label={inList ? "Remover da lista" : "Adicionar à lista"} onClick={(e) => { e.stopPropagation(); onToggleList(movie); }} className="size-9 rounded-full border-2 border-foreground/60 text-foreground flex items-center justify-center hover:border-primary">
            {inList ? <Check className="size-4" /> : <Plus className="size-4" />}
          </button>
        </div>
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
          {!movie.soon && <span className={ACCENT}>{movie.match}% relevante</span>}
          <span className="px-1 border border-muted-foreground/60 rounded-xs">{movie.age}</span>
          <span>{movie.duration}</span>
          <span className="text-muted-foreground">{movie.genre}</span>
        </p>
      </div>

      {progress != null && (
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-background/70" aria-label={`${progress}% assistido`}>
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
