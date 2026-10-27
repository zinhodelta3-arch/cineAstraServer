"use client";

import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";
import { Bookmark } from "lucide-react";
import { POPULAR, RECENT, PROGRESS, PREMIERES, SOON, TOP10, GENRES } from "./data";
import Button from "./button";
import SectionTitle from "./section-title";
import Row from "./row";
import HeroSection from "./hero-section";
import Thumb from "./thumb";
import Top10Card from "./top10-card";
import PosterTile from "./poster-tile";
import PlayerModal from "./player-modal";
import DetailsModal from "./details-modal";
import ListDrawer from "./list-drawer";
import CinemaStyles from "./cinema-styles";

export default function CineAstraStream() {
  const { genre, setGenre, playing, setPlaying, details, setDetails, myList, isListOpen, isInList, toggleList, filtered, closePlayer, closeDetails, openList, closeList } = useStreamingHome();

  const thumb = (m) => (
    <Thumb key={m.id} movie={m} onSelect={setDetails} onPlay={setPlaying} inList={isInList(m.id)} onToggleList={toggleList} progress={PROGRESS[m.id]} />
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <CinemaStyles />

    <HeroSection
      onPlay={setPlaying}
      onSelect={setDetails}
      myList={myList}
      onToggleList={toggleList}
      />

      {/* FILEIRAS DE CONTEÚDO COM ESPAÇAMENTO REFINADO */}
      <div className="relative z-30 -mt-28 sm:-mt-36 space-y-4 md:space-y-6">
        <Row title="Populares na CineAstra">{POPULAR.map((m) => thumb(m))}</Row>
        <Row title="Assistidos recentemente">{RECENT.map((m) => thumb(m))}</Row>
        <Row title="Top 10 no Brasil hoje">
          {TOP10.map((m, i) => <Top10Card key={m.id} movie={m} rank={i + 1} onSelect={setDetails} />)}
        </Row>
        <Row title="Estreias da semana">{PREMIERES.map((m) => thumb(m))}</Row>
        <Row title="Valem a espera">{SOON.map((m) => thumb(m))}</Row>
      </div>

      {/* CATÁLOGO COMPLETO */}
      <section id="catalogo" className="py-20 max-w-[1800px] mx-auto px-5 md:px-12">
        <SectionTitle eyebrow="Catálogo completo" title="Todos os filmes" description="Escolha um gênero e explore o catálogo da CineAstra." />

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {GENRES.map((g) => (
            <Button key={g} variant={genre === g ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setGenre(g)}>{g}</Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum filme neste gênero no momento.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
            {filtered.map((m) => <PosterTile key={m.id} movie={m} onSelect={setDetails} inList={isInList(m.id)} />)}
          </div>
        )}
      </section>

      {/* MODAIS & LISTA */}
      {playing && <PlayerModal movie={playing} onClose={closePlayer} />}
      {details && (
        <DetailsModal
          key={details.id}
          movie={details}
          onClose={closeDetails}
          onPlay={setPlaying}
          inList={isInList(details.id)}
          onToggleList={toggleList}
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

    </div>
  );
}
