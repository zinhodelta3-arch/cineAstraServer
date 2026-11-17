import FilmWatch from "@/components/streaming/watch/film-watch";

export const metadata = { title: "Assistir filme | CineAstra" };

export default async function FilmWatchPage({ params, searchParams }) {
  const { id } = await params;
  const { reproduzir } = await searchParams;
  return <FilmWatch key={id} filmId={id} autoStart={reproduzir === "1"} />;
}
