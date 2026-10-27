import useFilmArt from "@/hooks/streaming/home/use-film-art";
import Motif from "./motif";

export default function FilmArt({ movie, showTitle = true, className = "" }) {
  const { id, p, lines, size, lh, lastY } = useFilmArt(movie);

  return (
    <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Arte de ${movie.title}`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg1} /><stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".4" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".75" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill={`url(#${id}-bg)`} />
      <Motif kind={movie.motif} p={p} seed={movie.id} />
      {showTitle && (
        <>
          <rect width="800" height="800" fill={`url(#${id}-sh)`} />
          {lines.map((line, i) => (
            <text key={i} x="400" y={lastY - (lines.length - 1 - i) * lh} textAnchor="middle" fontFamily="'Big Shoulders Display', Impact, sans-serif" fontWeight="900" fontSize={size} fill={p.t}>
              {line}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}
