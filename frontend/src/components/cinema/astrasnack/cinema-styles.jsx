"use client";


export default function CinemaStyles() {
  return (
    <style jsx global>{`
      .astra-grain {
        position: relative;
        isolation: isolate;
      }

      .astra-grain::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 40;
        opacity: .035;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
      }

      .astra-perf {
        background-image: radial-gradient(circle at 8px 50%, currentColor 0 3px, transparent 3.5px);
        background-size: 18px 100%;
      }

      .astra-banner {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 75% 20%, rgba(250,210,65,.22), transparent 24%),
          linear-gradient(110deg, rgba(124,16,41,.95), rgba(53,51,35,.96) 48%, rgba(151,29,0,.92));
      }

      .astra-banner::before {
        content: "";
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(115deg, transparent 0 32px, rgba(255,255,255,.035) 33px 34px);
      }

      .astra-banner::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,.38) 100%);
      }

      .astra-ticket {
        position: relative;
        overflow: hidden;
      }

      .astra-ticket::before,
      .astra-ticket::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: var(--background);
        transform: translateY(-50%);
      }

      .astra-ticket::before { left: -11px; }
      .astra-ticket::after { right: -11px; }

      .astra-card {
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }

      .astra-card:hover {
        transform: translateY(-4px);
        border-color: color-mix(in oklab, var(--primary) 50%, var(--border));
        box-shadow: 0 16px 36px rgba(0,0,0,.14);
      }
    `}</style>
  )
}
