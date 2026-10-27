"use client";


export default function VenueArt({ kind, className = "" }) {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <rect width="400" height="250" className="fill-card" />

      {kind === "marquee" && (
        <g>
          <rect y="180" width="400" height="70" className="fill-muted" />
          <rect x="40" y="62" width="320" height="120" className="fill-secondary" />
          <rect x="84" y="30" width="232" height="56" rx="4" className="fill-background stroke-primary" strokeWidth="3" />
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i}>
              <circle cx={96 + i * 19} cy="37" r="2.5" className="fill-primary" />
              <circle cx={96 + i * 19} cy="79" r="2.5" className="fill-primary" />
            </g>
          ))}
          <text x="200" y="66" textAnchor="middle" fontSize="26" fontWeight="900" className="fill-primary" style={{ fontFamily: "'Big Shoulders Display', Impact, sans-serif" }}>CINEASTRA</text>
          {[58, 312].map((x) => <rect key={x} x={x} y="104" width="30" height="46" rx="2" className="fill-background stroke-border" strokeWidth="2" />)}
          {[128, 180, 232].map((x) => <rect key={x} x={x} y="118" width="40" height="64" rx="2" className="fill-background stroke-border" strokeWidth="2" />)}
        </g>
      )}

      {kind === "curtain" && (
        <g>
          <rect width="400" height="250" className="fill-background" />
          <polygon points="200,0 110,196 290,196" className="fill-primary" opacity=".16" />
          <rect y="192" width="400" height="58" className="fill-muted" />
          <path d="M0 0 H124 C102 80 132 150 92 250 H0 Z" className="fill-secondary" />
          <path d="M400 0 H276 C298 80 268 150 308 250 H400 Z" className="fill-secondary" />
          <rect width="400" height="26" className="fill-secondary" />
          {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={20 + i * 40} cy="26" r="20" className="fill-secondary" />)}
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={14 + i * 32} y="222" width="24" height="28" rx="7" className="fill-card stroke-border" strokeWidth="2" />)}
        </g>
      )}

      {kind === "screen" && (
        <g>
          <rect width="400" height="250" className="fill-background" />
          <path d="M50 40 Q200 8 350 40 L350 118 Q200 88 50 118 Z" className="fill-primary stroke-primary" strokeWidth="3" fillOpacity=".22" />
          {[0, 1, 2, 3].map((r) => {
            const n = 10 + r * 2, w = 14 + r * 3, gap = 6, total = n * (w + gap) - gap;
            return Array.from({ length: n }).map((_, c) => (
              <rect key={`${r}-${c}`} x={(400 - total) / 2 + c * (w + gap)} y={150 + r * 24} width={w} height={14 + r * 2} rx="5" className="fill-secondary" />
            ));
          })}
        </g>
      )}
    </svg>
  );
}
