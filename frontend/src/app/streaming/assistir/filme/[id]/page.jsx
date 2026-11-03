import FilmWatch from "@/components/streaming/watch/film-watch";

export const metadata = { title: "Assistir filme | CineAstra" };

export default async function FilmWatchPage({ params }) {
  const { id } = await params;
  return <FilmWatch key={id} filmId={id} />;
}
