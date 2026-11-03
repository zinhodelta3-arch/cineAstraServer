"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bookmark } from "lucide-react";
import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";
import useAstraSpin from "@/hooks/streaming/astra-spin/use-astra-spin";
import { buildCatalog } from "@/hooks/streaming/astra-spin/astra-spin-engine";
import Button from "./button";
import SectionTitle from "./section-title";
import PlayerModal from "./player-modal";
import DetailsModal from "./details-modal";
import ListDrawer from "./list-drawer";
import CinemaStyles from "./cinema-styles";
import AstraSpinStyles from "./astra-spin-styles";
import AstraSpinReel from "./astra-spin-reel";
import AstraSpinTicket from "./astra-spin-ticket";
import AstraSpinControls from "./astra-spin-controls";

export default function AstraSpinStream() {
  const {
    ready, error, retry, actionError, profile, history, catalog: films, popular, recent, premieres, explore, genres: availableGenres, favoriteIds, accessByFilm, updateProgress,
    playing, setPlaying, details, setDetails, myList, isListOpen, toggleList,
    closePlayer, closeDetails, openList, closeList,
  } = useStreamingHome();

  const catalog = useMemo(() => buildCatalog(popular, recent, explore, premieres), [popular, recent, explore, premieres]);

  const historyIds = useMemo(
    () => history.map((item) => item.filmId),
    [history]
  );
  const myListIds = useMemo(
    () => myList.map((m) => String(typeof m === "object" ? m.id : m)),
    [myList]
  );
  const genres = useMemo(() => availableGenres.map((item) => item.nome), [availableGenres]);

  const idleItems = useMemo(() => {
    if (!catalog.length) return [];
    const out = [];
    while (out.length < 14) out.push(...catalog);
    return out;
  }, [catalog]);

  const astra = useAstraSpin({ catalog, historyIds, myListIds });
  const { phase, busy, result, strip, spinId, duration, notice, spin } = astra;

  // Leva o ticket para a tela quando ele é impresso.
  const ticketRef = useRef(null);
  useEffect(() => {
    if (phase !== "revealed") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ticketRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [phase]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <CinemaStyles />
      <AstraSpinStyles />

      <section className="max-w-[1400px] mx-auto px-5 md:px-12 pt-28 md:pt-32 pb-24">
        <SectionTitle
          eyebrow="AstraSpin"
          title="Sem ideia do que assistir? Gire."
          description="Diga como você está e a roleta escolhe um filme do catálogo da CineAstra."
        />

        {!ready ? <div role={error ? "alert" : "status"}><p>{error || "Carregando filmes..."}</p>{error && <Button className="mt-4" onClick={retry}>Tentar novamente</Button>}</div> : catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">O catálogo está vazio no momento.</p>
        ) : (
          <>
            <AstraSpinReel phase={phase} strip={strip} idleItems={idleItems} spinId={spinId} duration={duration} />

            <p className="sr-only" role="status" aria-live="polite">
              {busy ? "Girando a roleta…" : phase === "revealed" && result ? `A roleta escolheu ${result.entry.title}.` : ""}
            </p>

            {notice && !busy && (
              <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted-foreground">{notice}</p>
            )}

            {phase === "revealed" && result && (
              <div ref={ticketRef} className="mt-6">
                <AstraSpinTicket
                  result={result}
                  inList={favoriteIds.has(result.entry.movie.id)}
                  onPlay={setPlaying}
                  onDetails={setDetails}
                  onToggleList={toggleList}
                  onRespin={spin}
                />
              </div>
            )}

            <AstraSpinControls astra={astra} genres={genres} />
          </>
        )}
        {actionError && <p role="alert" className="mt-6 text-sm text-destructive">{actionError}</p>}
      </section>

      {/* MODAIS & LISTA */}
      {playing && profile && <PlayerModal movie={playing} profileId={profile.id} access={accessByFilm[playing.id]} onProgress={updateProgress} onClose={closePlayer} />}
      {details && (
        <DetailsModal
          key={details.id}
          movie={details}
          onClose={closeDetails}
          onPlay={setPlaying}
          inList={favoriteIds.has(details.id)}
          onToggleList={toggleList}
          catalog={films}
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

      {isListOpen && <ListDrawer items={myList} onRemove={toggleList} onPlay={setPlaying} onClose={closeList} />}
    </div>
  );
}
