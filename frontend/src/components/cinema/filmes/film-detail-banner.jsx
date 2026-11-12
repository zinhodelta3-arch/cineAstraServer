import ResponsiveFilmBanner from './responsive-film-banner';

export default function FilmDetailBanner({ movie }) {
  return <div className="relative aspect-video w-full min-w-0 overflow-hidden rounded-lg border border-border bg-muted sm:aspect-[2/1]">
    <ResponsiveFilmBanner filmId={movie.id} context="CINEMA_FILME" cover={movie.poster} imagePosition="object-center" />
  </div>;
}
