"use client";

import { hash } from "@/hooks/streaming/astra-spin/astra-spin-engine";

// Pôster gerado por código: cada filme ganha sempre a mesma arte (cores pelo gênero,
// composição escolhida pelo id/título). Se o filme já tiver imagem real, ela tem prioridade.

const PALETTES = [
  { keys: ["terror", "horror"], top: "#14080b", bottom: "#5a0f19", accent: "#ff4d4d", ink: "#f6e7df" },
  { keys: ["comedia"], top: "#ffb703", bottom: "#f3581e", accent: "#fff1a8", ink: "#2a1400" },
  { keys: ["acao"], top: "#ff7a1a", bottom: "#3a0f0a", accent: "#ffd166", ink: "#fff4e0" },
  { keys: ["romance"], top: "#ff8fab", bottom: "#5b2a86", accent: "#ffe0ea", ink: "#fff6fa" },
  { keys: ["ficcao", "fantasia"], top: "#0b1f4d", bottom: "#00a6c8", accent: "#9bf6ff", ink: "#effcff" },
  { keys: ["animacao", "familia"], top: "#4cc9f0", bottom: "#7209b7", accent: "#ffd60a", ink: "#ffffff" },
  { keys: ["aventura"], top: "#2d6a4f", bottom: "#0b2e1f", accent: "#f9c74f", ink: "#fff8e1" },
  { keys: ["suspense", "misterio", "crime", "thriller"], top: "#3d3b5c", bottom: "#0c0b17", accent: "#7bdff2", ink: "#eef2ff" },
  { keys: ["drama", "biografia", "guerra", "documentario"], top: "#2b3a4a", bottom: "#0e1519", accent: "#e9b872", ink: "#f5ede0" },
];

function paletteFor(entry, seed) {
  for (const g of entry.genres ?? []) {
    const p = PALETTES.find((x) => x.keys.some((k) => g.includes(k)));
    if (p) return p;
  }
  const hue = seed % 360;
  return {
    top: `hsl(${hue} 70% 52%)`,
    bottom: `hsl(${(hue + 40) % 360} 60% 16%)`,
    accent: `hsl(${(hue + 180) % 360} 90% 72%)`,
    ink: "#ffffff",
  };
}

function wrapTitle(title, max = 11) {
  const words = String(title).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= max) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = `${lines[2]}…`;
  }
  return lines;
}

function Motif({ kind, p, rnd }) {
  if (kind === 0) {
    // sol e montanhas
    const y1 = rnd(4, 205, 235), y2 = rnd(5, 185, 215), y3 = rnd(6, 170, 200);
    return (
      <>
        <circle cx={rnd(1, 70, 130)} cy={rnd(2, 150, 185)} r={rnd(3, 38, 54)} fill={p.accent} opacity=".92" />
        <polygon points={`0,300 0,${y1} 55,${y2} 105,${y3} 150,${y2} 200,${y1} 200,300`} fill="#000" opacity=".28" />
        <polygon points={`0,300 0,${y1 + 30} 70,${y2 + 34} 130,${y3 + 26} 200,${y1 + 36} 200,300`} fill="#000" opacity=".5" />
      </>
    );
  }
  if (kind === 1) {
    // raios saindo de um ponto
    const cy = rnd(1, 165, 195);
    const n = 14;
    return (
      <>
        {Array.from({ length: n }, (_, i) => {
          const a0 = (i * 2 * Math.PI) / n;
          const a1 = a0 + Math.PI / n;
          const pt = (a) => `${100 + 420 * Math.sin(a)},${cy - 420 * Math.cos(a)}`;
          return <polygon key={i} points={`100,${cy} ${pt(a0)} ${pt(a1)}`} fill={p.accent} opacity=".16" />;
        })}
        <circle cx="100" cy={cy} r="24" fill={p.accent} opacity=".95" />
        <rect x="0" y="250" width="200" height="50" fill="#000" opacity=".45" />
      </>
    );
  }
  if (kind === 2) {
    // cidade e lua
    return (
      <>
        <circle cx={rnd(1, 120, 165)} cy={rnd(2, 150, 185)} r={rnd(3, 20, 30)} fill={p.accent} opacity=".9" />
        {Array.from({ length: 10 }, (_, i) => {
          const h = rnd(10 + i, 60, 150);
          return (
            <g key={i}>
              <rect x={i * 20 + 1} y={300 - h} width="18" height={h} fill="#000" opacity=".55" />
              <rect x={i * 20 + 5} y={300 - h + 10} width="3" height="4" fill={p.accent} opacity=".6" />
              <rect x={i * 20 + 11} y={300 - h + 22} width="3" height="4" fill={p.accent} opacity=".5" />
            </g>
          );
        })}
      </>
    );
  }
  // geométrico
  return (
    <>
      <rect x="45" y="125" width="110" height="110" transform="rotate(45 100 180)" fill={p.accent} opacity=".22" />
      <circle cx="100" cy="180" r={rnd(1, 34, 50)} fill="none" stroke={p.accent} strokeWidth="3" opacity=".8" />
      <circle cx="100" cy="180" r={rnd(2, 14, 24)} fill={p.accent} opacity=".9" />
      <polygon points="0,300 200,300 200,250 0,282" fill="#000" opacity=".4" />
    </>
  );
}

// Conteúdo SVG (coordenadas 200x300), para usar dentro de outro <svg>.
export function PosterArtNodes({ entry }) {
  const seed = hash(`${entry.id}:${entry.title}`);
  const rnd = (n, a, b) => a + ((hash(`${seed}:${n}`) % 1000) / 1000) * (b - a);
  const p = paletteFor(entry, seed);
  const uid = `pa-${entry.id}`.replace(/[^a-zA-Z0-9_-]/g, "");

  const lines = wrapTitle(entry.title);
  const longest = Math.max(...lines.map((l) => l.length));
  let fs = Math.max(13, Math.min(32, 136 / (longest * 0.66)));
  if (lines.length > 2) fs *= 0.85;

  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={p.top} />
          <stop offset="1" stopColor={p.bottom} />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".5" />
        </radialGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${uid}-bg)`} />
      <Motif kind={seed % 4} p={p} rnd={rnd} />
      <rect width="200" height="300" fill={`url(#${uid}-vig)`} />
      {lines.map((l, i) => (
        <text
          key={i}
          x="100"
          y={62 + i * fs * 1.08}
          textAnchor="middle"
          fontSize={fs}
          fontWeight="900"
          fill={p.ink}
          stroke="rgba(0,0,0,.35)"
          strokeWidth="3"
          paintOrder="stroke"
          strokeLinejoin="round"
          letterSpacing=".5"
          fontFamily="Impact, 'Arial Black', system-ui, sans-serif"
        >
          {l.toUpperCase()}
        </text>
      ))}
      {entry.year ? (
        <text x="100" y="288" textAnchor="middle" fontSize="11" fill={p.ink} opacity=".75" fontFamily="system-ui, sans-serif">
          {entry.year}
        </text>
      ) : null}
    </>
  );
}

// Pôster completo, para usar em HTML (ticket, listas...).
export default function PosterArt({ entry, className }) {
  return (
    <svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Pôster de ${entry.title}`}>
      <PosterArtNodes entry={entry} />
    </svg>
  );
}