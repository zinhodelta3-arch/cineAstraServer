import Art from "./art";
import ticket from "./film-ticket.module.css";

export default function Top10Card({ movie, rank, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} aria-label={`${rank}º ${movie.title}`}
      className="flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-md border border-border bg-card text-left motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:w-44">
      <span className="block aspect-[2/3] w-full overflow-hidden">
        <Art movie={movie} variant="poster" showTitle={false} className="size-full object-cover" />
      </span>
      <span className={`${ticket.stub} ${ticket.notches} w-full`} aria-hidden="true">
        <span className={`${ticket.rank} f-display text-3xl leading-none font-black`}>{rank}</span>
        <span className="line-clamp-2 min-w-0 text-xs leading-snug font-semibold wrap-break-word text-card-foreground">{movie.title}</span>
      </span>
    </button>
  );
}
