export default function CinemaStyles() {
  return (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');
    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .f-title { font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .grain::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
    .perf { height: 14px; background: repeating-linear-gradient(90deg, var(--primary) 0 12px, transparent 12px 26px); opacity: .6; border-radius: 2px; }
    .perf-v { width: 14px; background: repeating-linear-gradient(180deg, var(--border) 0 12px, transparent 12px 26px); opacity: .8; }
    .ticket { --n: 68%;
      -webkit-mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
      mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat; }
    .tear { border-top: 2px dashed var(--border); }
    .poster-scrim { background: linear-gradient(0deg, color-mix(in oklab, var(--background) 92%, transparent) 0%, color-mix(in oklab, var(--background) 45%, transparent) 40%, transparent 75%); }
    .hero-tint { background: radial-gradient(90% 70% at 88% 12%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%), radial-gradient(70% 60% at 0% 100%, color-mix(in oklab, var(--secondary) 22%, transparent), transparent 65%); }

    /* Letreiro de lâmpadas (o único movimento contínuo da página) */
    .bulbs { height: 14px;
      background: radial-gradient(circle at center, var(--primary) 0 3.5px, transparent 4.5px) 0 50% / 22px 14px repeat-x;
      filter: drop-shadow(0 0 4px color-mix(in oklab, var(--primary) 70%, transparent));
      animation: bulb 2.4s steps(1) infinite; }
    @keyframes bulb { 50% { opacity: .55; } }
    .ca-root input::placeholder { opacity: .78; }
    .ca-root button, .ca-root a { -webkit-tap-highlight-color: transparent; }
    .ca-root :focus-visible { scroll-margin-top: 6rem; }
    @media (max-width: 640px) {
      .ca-root .ticket { grid-template-columns: 76px minmax(0, 1fr); min-height: 0; }
      .ca-root .ticket > div:last-child { padding: .75rem; }
    }
    .reveal { animation: reveal .35s ease-out both; }
    @keyframes reveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .bulbs, .reveal { animation: none; } }
  `}</style>
);
}
