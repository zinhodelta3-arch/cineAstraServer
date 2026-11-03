"use client";

import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";
import { ArrowRight, Bookmark, LayoutGrid } from "lucide-react";
import Link from "next/link";
import Button from "./button";
import Row from "./row";
import HeroSection from "./hero-section";
import Thumb from "./thumb";
import Top10Card from "./top10-card";
import { useRouter } from "next/navigation";
import DetailsModal from "./details-modal";
import ListDrawer from "./list-drawer";
import CinemaStyles from "./cinema-styles";

export default function CineAstraStream() {
  const { ready, error, actionError, setActionError, retry, catalog, genreRows, popular, heroes, recent, continuing, premieres, soon, progress, myList, favoriteIds, toggleList, details, setDetails, isListOpen, closeDetails, openList, closeList } = useStreamingHome();

  const router = useRouter();
  const setPlaying = (movie) => router.push(`/streaming/assistir/filme/${encodeURIComponent(movie.id)}`);

  const thumb = (m) => (
    <Thumb key={m.id} movie={m} onSelect={setDetails} onPlay={setPlaying} inList={favoriteIds.has(m.id)} onToggleList={toggleList} progress={progress[m.id]} />
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <CinemaStyles />

      {!ready && <div className="mx-auto max-w-[1800px] px-5 md:px-12 pt-32 pb-24" role={error ? "alert" : "status"}><p className="text-lg text-foreground">{error || "Carregando o streaming..."}</p>{error && <Button className="mt-4" onClick={retry}>Tentar novamente</Button>}</div>}
      {ready && actionError && <div role="alert" className="mx-auto max-w-[1800px] px-5 md:px-12 pt-6 text-sm text-destructive">{actionError} <button type="button" className="ml-3 underline" onClick={() => setActionError("")}>Fechar</button></div>}

      {ready && <>

    <HeroSection
      heroes={heroes}
      onPlay={setPlaying}
      onSelect={setDetails}
      myList={myList}
      onToggleList={toggleList}
      />

      <div className={`relative z-30 ${heroes.length ? "-mt-28 sm:-mt-36" : "pt-12"} space-y-4 md:space-y-6 pb-12`}>
        <Row title="Continuar assistindo" emptyMessage={!continuing.length ? "Os filmes com reprodução em andamento aparecerão aqui." : undefined}>{continuing.map((m) => thumb(m))}</Row>
        <Row title="Populares na CineAstra" emptyMessage={!popular.length ? "Os destaques de popularidade aparecerão aqui quando houver dados disponíveis." : undefined}>{popular.map((m) => thumb(m))}</Row>
        <Row title="Assistidos recentemente" emptyMessage={!recent.length ? "Seu histórico de filmes aparecerá aqui." : undefined}>{recent.map((m) => thumb(m))}</Row>
        <Row title="Mais assistidos na CineAstra" emptyMessage={!popular.length ? "O ranking aparecerá aqui conforme os dados de popularidade estiverem disponíveis." : undefined}>
          {popular.slice(0, 10).map((m, i) => <Top10Card key={m.id} movie={m} rank={i + 1} onSelect={setDetails} />)}
        </Row>
        <Row title="Lançamentos" emptyMessage={!premieres.length ? "Novos títulos aparecerão aqui em breve." : undefined}>{premieres.map((m) => thumb(m))}</Row>
        <Row title="Valem a espera" emptyMessage={!soon.length ? "Aguarde as próximas novidades do catálogo." : undefined}>{soon.map((m) => thumb(m))}</Row>
        {genreRows.map((row) => <Row key={row.id} title={row.title}>{row.films.map((movie) => thumb(movie))}</Row>)}
      </div>

      <div className="max-w-[1800px] mx-auto px-5 md:px-12 pb-16">
        <Link href="/streaming/categorias" className="flex min-h-16 flex-wrap items-center gap-3 rounded-md border border-dashed border-border bg-card px-6 py-5 text-sm font-bold text-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <LayoutGrid size={20} aria-hidden="true" /><span>Explorar todas as categorias</span><ArrowRight className="ml-auto" size={20} aria-hidden="true" />
        </Link>
      </div>

      {/* MODAIS & LISTA */}
      {details && (
        <DetailsModal
          key={details.id}
          movie={details}
          onClose={closeDetails}
          onPlay={setPlaying}
          inList={favoriteIds.has(details.id)}
          onToggleList={toggleList}
          catalog={catalog}
          progress={progress}
        />
      )}

      {myList.length > 0 && !isListOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button size="lg" onClick={openList} className="shadow-2xl gap-2">
            <Bookmark className="size-5" aria-hidden="true" />
            <span>Minha lista ({myList.length})</span>
          </Button>
        </div>
      )}

      {isListOpen && (
        <ListDrawer items={myList} onRemove={toggleList} onPlay={setPlaying} onClose={closeList} />
      )}

      </>}

    </div>
  );
}
