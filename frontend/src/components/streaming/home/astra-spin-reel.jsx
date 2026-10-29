"use client";

import { useEffect, useRef } from "react";
import { WINNER_INDEX } from "@/hooks/streaming/astra-spin/astra-spin-engine";

const GAP = 14;
const BULBS = 30;

function Bulbs() {
  return (
    <div className="astra-bulbs" aria-hidden="true">
      {Array.from({ length: BULBS }, (_, i) => <span key={i} className="astra-bulb" />)}
    </div>
  );
}

function Poster({ entry, state }) {
  return (
    <div className={`astra-poster relative shrink-0 overflow-hidden rounded-lg bg-card ${state ? `astra-${state}` : ""}`}>
      {entry.poster ? (
        <img src={entry.poster} alt="" draggable={false} decoding="async" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center bg-gradient-to-br from-primary/40 to-card p-3 text-center text-sm font-semibold">
          {entry.title}
        </div>
      )}
    </div>
  );
}

// phase: idle | spinning | hush | flash | revealed
export default function AstraSpinReel({ phase, strip, idleItems, spinId, duration }) {
  const boxRef = useRef(null);
  const trackRef = useRef(null);
  const centerX = useRef(0);

  const idle = phase === "idle";
  const settled = phase === "flash" || phase === "revealed";
  const items = idle ? [...idleItems, ...idleItems] : strip;

  // 1) Gira: desacelera até parar perto do vencedor (quase errando, para dar tensão).
  useEffect(() => {
    if (phase !== "spinning") return;
    const track = trackRef.current;
    const box = boxRef.current;
    if (!track || !box || !track.children.length) return;

    const first = track.children[0];
    const second = track.children[1];
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    const w = first.offsetWidth;

    const center = -(WINNER_INDEX * step + w / 2 - box.clientWidth / 2);
    centerX.current = center;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nearMiss = reduce ? 0 : (Math.random() > 0.5 ? 1 : -1) * w * (0.28 + Math.random() * 0.1);

    track.style.transition = "none";
    track.style.transform = "translate3d(0,0,0)";
    void track.offsetWidth; // força o reflow antes de animar
    track.style.transition = `transform ${duration}ms cubic-bezier(.1,.75,.12,1)`;
    track.style.transform = `translate3d(${center + nearMiss}px,0,0)`;
  }, [phase, spinId, duration]);

  // 2) Silêncio: as luzes caem e a fita se ajusta no vencedor.
  useEffect(() => {
    if (phase !== "hush") return;
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = "transform .6s cubic-bezier(.3,.7,.2,1)";
    track.style.transform = `translate3d(${centerX.current}px,0,0)`;
  }, [phase]);

  return (
    <div
      className="astra-stage relative rounded-3xl border border-border bg-card/60 py-4"
      data-phase={phase}
      aria-hidden="true"
    >
      <Bulbs />
      <div ref={boxRef} className="astra-window relative my-3 overflow-hidden py-9">
        <div className="astra-cone" />
        <div
          key={idle ? "idle" : `run-${spinId}`}
          ref={trackRef}
          className={`flex w-max items-center ${idle ? "astra-drift" : ""}`}
          style={{ gap: GAP, paddingRight: GAP }}
        >
          {items.map((e, i) => (
            <Poster
              key={`${e.id}-${i}`}
              entry={e}
              state={settled ? (i === WINNER_INDEX ? "win" : "dim") : null}
            />
          ))}
        </div>
        <div className="astra-frame" />
        <div className="astra-flash" />
      </div>
      <Bulbs />
    </div>
  );
}