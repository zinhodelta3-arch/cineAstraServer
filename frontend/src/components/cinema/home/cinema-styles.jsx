export default function CinemaStyles() { return (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');

    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }

    .f-title { font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }

    .grain::after {
      content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .perf { height: 14px; background: repeating-linear-gradient(90deg, var(--primary) 0 12px, transparent 12px 26px); opacity: .6; border-radius: 2px; }
    .perf-v { width: 14px; background: repeating-linear-gradient(180deg, var(--border) 0 12px, transparent 12px 26px); opacity: .8; }

    .ticket {
      --n: 68%;
      -webkit-mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
      mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
    }
    .ticket-v {
      --n: 62%;
      -webkit-mask: radial-gradient(circle 11px at var(--n) 0, #0000 97%, #000) top/100% 51% no-repeat, radial-gradient(circle 11px at var(--n) 100%, #0000 97%, #000) bottom/100% 51% no-repeat;
      mask: radial-gradient(circle 11px at var(--n) 0, #0000 97%, #000) top/100% 51% no-repeat, radial-gradient(circle 11px at var(--n) 100%, #0000 97%, #000) bottom/100% 51% no-repeat;
    }

    .tear { border-top: 2px dashed var(--border); }
    .tear-v { border-left: 2px dashed var(--border); }

    .screen-curve { border-radius: 50% 50% 0 0/14% 14% 0 0; box-shadow: 0 -24px 70px -26px color-mix(in oklab, var(--primary) 45%, transparent); }

    /* Degradês suaves, com várias paradas (sem corte seco), derivados do tema */
    .hero-scrim-x {
      background: linear-gradient(90deg,
        var(--background) 0%,
        color-mix(in oklab, var(--background) 94%, transparent) 20%,
        color-mix(in oklab, var(--background) 76%, transparent) 38%,
        color-mix(in oklab, var(--background) 48%, transparent) 55%,
        color-mix(in oklab, var(--background) 20%, transparent) 75%,
        color-mix(in oklab, var(--background) 6%, transparent) 90%,
        transparent 100%);
    }
    .hero-scrim-y {
      background: linear-gradient(180deg,
        color-mix(in oklab, var(--background) 55%, transparent) 0%,
        transparent 24%,
        transparent 52%,
        color-mix(in oklab, var(--background) 45%, transparent) 70%,
        color-mix(in oklab, var(--background) 82%, transparent) 88%,
        var(--background) 100%);
    }
    .hero-tint {
      background:
        radial-gradient(90% 70% at 88% 12%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%),
        radial-gradient(70% 60% at 0% 100%, color-mix(in oklab, var(--secondary) 22%, transparent), transparent 65%);
    }
    .poster-scrim {
      background: linear-gradient(0deg,
        color-mix(in oklab, var(--background) 90%, transparent) 0%,
        color-mix(in oklab, var(--background) 42%, transparent) 26%,
        transparent 55%);
    }

    /* Transição suave entre o hero e a próxima seção */
    .hero-bottom-fade {
      height: 9rem;
      background: linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--background) 60%, transparent) 55%, var(--background) 100%);
    }

    /* Divisor leve entre seções: linha de luz + brilho difuso */
    .section-sep { position: relative; height: 1px; background: linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--primary) 45%, transparent) 50%, transparent 100%); }
    .section-sep::after {
      content: ""; position: absolute; left: 12%; right: 12%; top: -14px; height: 28px; pointer-events: none;
      background: radial-gradient(60% 100% at 50% 50%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 75%);
    }

    /* Bordas superior/inferior de seção que "derretem" no fundo */
    .edge-fade-top::before, .edge-fade-bottom::after { content: ""; position: absolute; left: 0; right: 0; height: 7rem; pointer-events: none; z-index: 1; }
    .edge-fade-top::before { top: 0; background: linear-gradient(180deg, var(--background), transparent); }
    .edge-fade-bottom::after { bottom: 0; background: linear-gradient(0deg, var(--background), transparent); }

    .seat { width: 16px; height: 12px; border-radius: 5px 5px 2px 2px; background: var(--secondary); opacity: .8; }
  `}</style>
);
}
