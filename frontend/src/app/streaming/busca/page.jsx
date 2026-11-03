import { Suspense } from "react";
import StreamingSearch from "@/components/streaming/search/streaming-search";

export const metadata = { title: "Buscar filmes | CineAstra Streaming" };

export default function SearchPage() {
  return <Suspense fallback={<p role="status" className="p-8 text-muted-foreground">Carregando busca…</p>}>
    <StreamingSearch />
  </Suspense>;
}
