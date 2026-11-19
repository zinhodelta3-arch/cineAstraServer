import CinemaMovies from "@/components/cinema/filmes/cinema-movies";
import { Suspense } from "react";

export default function Page() {
  return <Suspense fallback={<p role="status" className="mx-auto max-w-[1240px] p-5">Carregando filmes…</p>}>
    <CinemaMovies />
  </Suspense>;
}
