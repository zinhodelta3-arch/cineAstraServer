import { ACCENT } from "./data";
import Art from "./art";

export default function Card({ movie, onOpen, progress, meta, actions, label }) {
  return (
    <div
      role="button" tabIndex={0} aria-label={label ?? movie.title}
      onClick={() => onOpen(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(movie))}
      className="group snap-start shrink-0 relative w-[250px] md:w-[300px] aspect-video rounded-md overflow-hidden bg-card border border-border cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:z-20 hover:border-primary hover:shadow-2xl hover:shadow-black/60 focus-visible:ring-2 focus-visible:ring-primary outline-hidden"
    >
      <Art movie={movie} className="absolute inset-0 size-full" />
      <span className="absolute top-2 left-2 f-display text-[13px] font-black tracking-[0.18em] text-primary bg-black/60 px-1.5 rounded-xs leading-tight">CINEASTRA</span>
      {meta && <span className="absolute top-2 right-2 text-[11px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">{meta}</span>}

      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-1.5">{actions}</div>
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
          <span className={ACCENT}>{movie.match}% relevante</span>
          <span className="px-1 border border-muted-foreground/60 rounded-xs">{movie.age}</span>
          <span>{movie.duration}</span>
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
