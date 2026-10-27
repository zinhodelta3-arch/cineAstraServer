

export default function Art({ movie, className = "" }) {
  const [a, b] = movie.bg;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} role="img" aria-label={`Arte de ${movie.title}`}>
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
      <span className="f-display absolute inset-x-3 bottom-2 text-2xl md:text-3xl font-black uppercase leading-[0.9] text-white">{movie.title}</span>
    </div>
  );
}
