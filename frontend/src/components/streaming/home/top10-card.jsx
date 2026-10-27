import Art from "./art";

export default function Top10Card({ movie, rank, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} className="group snap-start shrink-0 flex items-end overflow-hidden outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg" aria-label={`${rank}º ${movie.title}`}>
      <span className="top-num text-[11rem] md:text-[14rem] -mr-8 relative z-0 select-none transition-colors group-hover:[-webkit-text-stroke-color:var(--primary)]" aria-hidden="true">{rank}</span>
      <span className="relative z-10 block w-32 md:w-40 aspect-[2/3] overflow-hidden rounded-md border border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20">
        <Art movie={movie} variant="poster" className="size-full object-cover" />
      </span>
    </button>
  );
}
