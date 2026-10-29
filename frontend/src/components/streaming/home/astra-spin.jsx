"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bookmark } from "lucide-react";
import useStreamingHome from "@/hooks/streaming/home/use-streaming-home";
import useAstraSpin from "@/hooks/streaming/astra-spin/use-astra-spin";
import { buildCatalog, norm } from "@/hooks/streaming/astra-spin/astra-spin-engine";
import { POPULAR, RECENT, PROGRESS, PREMIERES, TOP10, GENRES } from "./data";
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
    playing, setPlaying, details, setDetails, myList, isListOpen, isInList, toggleList,
    closePlayer, closeDetails, openList, closeList,
  } = useStreamingHome();

  // Só filmes já disponíveis (fica de fora "Valem a espera"). Se existir um catálogo completo
  // em data.js, passe ele aqui no lugar das listas.
  const catalog = useMemo(() => buildCatalog(POPULAR, RECENT, TOP10, PREMIERES), []);

  const historyIds = useMemo(
    () => [...RECENT.map((m) => String(m.id)), ...Object.keys(PROGRESS ?? {})],
    []
  );
  const myListIds = useMemo(
    () => myList.map((m) => String(typeof m === "object" ? m.id : m)),
    [myList]
  );
  const genres = useMemo(() => GENRES.filter((g) => norm(g) !== "todos"), []);

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

        {catalog.length === 0 ? (
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
                  inList={isInList(result.entry.movie.id)}
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

      {isListOpen && <ListDrawer items={myList} onRemove={toggleList} onPlay={setPlaying} onClose={closeList} />}
    </div>
  );
}