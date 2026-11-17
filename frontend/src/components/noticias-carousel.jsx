"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Pause, Play } from "lucide-react";

const DURACAO_MS = 6500;

const CarouselStyles = () => (
  <style>{`
    @keyframes nc-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes nc-in-next { from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: none; } }
    @keyframes nc-in-prev { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: none; } }
    @keyframes nc-icon { from { opacity: 0; transform: scale(.82) rotate(-6deg); } to { opacity: .14; transform: none; } }
    @keyframes nc-stage { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

    .nc-stage { animation: nc-stage .9s cubic-bezier(.77,0,.18,1) both; }
    .nc-text-next > * { animation: nc-in-next .55s cubic-bezier(.2,.8,.2,1) both; }
    .nc-text-prev > * { animation: nc-in-prev .55s cubic-bezier(.2,.8,.2,1) both; }
    .nc-text-next > *:nth-child(2), .nc-text-prev > *:nth-child(2) { animation-delay: .06s; }
    .nc-text-next > *:nth-child(3), .nc-text-prev > *:nth-child(3) { animation-delay: .12s; }
    .nc-text-next > *:nth-child(4), .nc-text-prev > *:nth-child(4) { animation-delay: .18s; }
    .nc-icon { animation: nc-icon .8s cubic-bezier(.2,.8,.2,1) both; }
    .nc-fill { transform-origin: left; animation: nc-fill ${DURACAO_MS}ms linear forwards; }

    @media (prefers-reduced-motion: reduce) {
      .nc-stage, .nc-text-next > *, .nc-text-prev > *, .nc-icon { animation: none; }
      .nc-icon { opacity: .14; }
      .nc-fill { animation: none; transform: scaleX(1); }
    }
  `}</style>
);

export default function NoticiasCarousel({ noticias, onOpen }) {
  // Matéria em destaque primeiro
  const slides = useMemo(
    () => [...noticias].sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque)),
    [noticias]
  );
  const n = slides.length;

  const [i, setI] = useState(0);
  const [dir, setDir] = useState("next");
  const [hover, setHover] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const startX = useRef(null);

  const parado = hover || manualPause;

  const ir = useCallback(
    (alvo, direcao) => {
      setDir(direcao);
      setI(((alvo % n) + n) % n);
    },
    [n]
  );
  const proxima = useCallback(() => ir(i + 1, "next"), [i, ir]);
  const anterior = useCallback(() => ir(i - 1, "prev"), [i, ir]);

  if (n === 0) return null;

  const s = slides[i];
  const Icon = s.icon;

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") proxima();
    if (e.key === "ArrowLeft") anterior();
  };
  const onPointerDown = (e) => { startX.current = e.clientX; };
  const onPointerUp = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) (dx < 0 ? proxima : anterior)();
  };

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Principais notícias"
      className="h-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onKeyDown={onKeyDown}
    >
      <CarouselStyles />

      <div
        className="nc-stage relative h-full min-h-[460px] overflow-hidden rounded-xl border border-border bg-card flex flex-col"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { startX.current = null; }}
      >
        {/* Fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-card to-card" aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(70% 80% at 100% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 65%)" }}
          aria-hidden="true"
        />
        <Icon key={`ic-${s.id}`} className="nc-icon absolute -right-6 -bottom-6 w-72 h-72 md:w-96 md:h-96 text-primary" aria-hidden="true" />

        {/* Conteúdo */}
        <div
          className="relative flex-1 p-6 md:p-10 flex flex-col"
          aria-live={parado ? "polite" : "off"}
          aria-atomic="true"
        >
          <div key={s.id} className={`flex-1 flex flex-col ${dir === "next" ? "nc-text-next" : "nc-text-prev"}`}>
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                {s.destaque ? "Manchete" : s.categoria}
              </span>
              {s.destaque && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                  {s.categoria}
                </span>
              )}
            </div>

            <h2 className="f-display uppercase text-4xl sm:text-5xl lg:text-6xl font-black text-card-foreground leading-[0.95] mb-4 max-w-2xl">
              {s.titulo}
            </h2>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mb-6">{s.resumo}</p>

            <div className="mt-auto flex items-center gap-x-5 gap-y-4 flex-wrap">
              <button
                type="button"
                onClick={() => onOpen(s)}
                className="inline-flex items-center justify-center font-bold rounded-full px-6 py-3 text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Ler matéria completa <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </button>
              <span className="flex items-center gap-x-4 text-xs text-muted-foreground">
                <span className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{s.data}</span>
                <span className="flex items-center"><Clock3 className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{s.leitura}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="relative px-6 md:px-10 pb-5 flex items-center gap-4">
          <div className="flex flex-1 gap-2" role="group" aria-label="Escolher notícia">
            {slides.map((it, k) => (
              <button
                key={it.id}
                type="button"
                onClick={() => ir(k, k > i ? "next" : "prev")}
                aria-label={`Ir para a notícia ${k + 1}: ${it.titulo}`}
                aria-current={k === i}
                className="group flex-1 py-2 focus:outline-none"
              >
                <span className="block h-1 rounded-full bg-border overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-primary">
                  {k < i && <span className="block h-full bg-primary" />}
                  {k === i && (
                    <span
                      key={`fill-${i}`}
                      className="nc-fill block h-full bg-primary"
                      style={{ animationPlayState: parado ? "paused" : "running" }}
                      onAnimationEnd={proxima}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs tabular-nums text-muted-foreground hidden sm:block" aria-hidden="true">
            {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setManualPause((v) => !v)} aria-label={manualPause ? "Retomar rotação automática" : "Pausar rotação automática"} className="p-2 rounded-full border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {manualPause ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
            </button>
            <button type="button" onClick={anterior} aria-label="Notícia anterior" className="p-2 rounded-full border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={proxima} aria-label="Próxima notícia" className="p-2 rounded-full border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}