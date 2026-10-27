import { Check } from "lucide-react";
import { ACCENT } from "./data";
import Art from "./art";

export default function PosterTile({ movie, onSelect, inList }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} aria-label={movie.title} className="group relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-card transition-all duration-300 hover:scale-[1.05] hover:z-10 hover:border-primary hover:shadow-xl hover:shadow-black/60 outline-hidden focus-visible:ring-2 focus-visible:ring-primary">
      <Art movie={movie} variant="poster" className="absolute inset-0 size-full object-cover" />
      <span className="absolute top-1.5 left-1.5 f-display text-[11px] font-black tracking-[0.18em] text-primary bg-black/60 px-1 rounded-xs leading-tight">CINEASTRA</span>
      {inList && <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="size-3" /></span>}
      <span className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-background to-transparent text-left opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`block text-[11px] font-semibold ${ACCENT}`}>{movie.genre}</span>
        <span className="block text-[11px] text-foreground">{movie.duration} · {movie.age}</span>
      </span>
    </button>
  );
}
