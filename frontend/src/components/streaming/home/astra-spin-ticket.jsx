"use client";

import { Bookmark, BookmarkCheck, Check, Info, Play, RotateCw } from "lucide-react";
import Button from "./button";
import { formatMinutes, hash } from "@/hooks/streaming/astra-spin/astra-spin-engine";

const INK = "text-[#1b1512]";

function Barcode({ seed }) {
  const bars = Array.from({ length: 34 }, (_, i) => 1 + (((seed >> (i % 24)) + i * 7) % 4));
  return (
    <div className="flex h-10 items-stretch gap-[2px]" aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} style={{ width: w * 1.5 }} className={i % 2 ? "bg-transparent" : "bg-current"} />
      ))}
    </div>
  );
}

function StubItem({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] opacity-75">{label}</dt>
      <dd className="font-mono text-lg font-bold leading-tight">{value}</dd>
    </div>
  );
}

export default function AstraSpinTicket({ result, inList, onPlay, onDetails, onToggleList, onRespin }) {
  const { entry, reasons, fit, context } = result;

  const h = hash(entry.id);
  const room = String((h % 9) + 1).padStart(2, "0");
  const seat = `${"ABCDEFGH"[(h >> 3) % 8]}${((h >> 6) % 14) + 1}`;
  const code = `AS-${String(h % 1000000).padStart(6, "0")}`;
  const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const meta = [entry.year, entry.minutes ? formatMinutes(entry.minutes) : null, ...entry.genreLabels.slice(0, 2)].filter(Boolean);
  const shown = reasons.filter((r) => r.ok);

  return (
    <div>
      {/* fenda da máquina de bilhetes */}
      <div className="mx-auto h-2 max-w-4xl rounded-full bg-black/70 shadow-[0_0_24px_rgba(242,196,109,.35)]" aria-hidden="true" />

      <article
        className="astra-print relative mx-auto grid max-w-4xl md:grid-cols-[1fr_230px]"
        aria-label={`Ingresso para ${entry.title}`}
      >
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[#f2c46d]/10 blur-2xl" aria-hidden="true" />

        {/* corpo do ingresso */}
        <div className={`rounded-t-2xl bg-[#efe6d2] p-5 sm:p-7 md:rounded-l-2xl md:rounded-tr-none ${INK}`}>
          <div className="flex items-baseline justify-between gap-4 text-xs">
            <p className="font-bold">CineAstra</p>
            <p className="truncate font-mono opacity-70">{context ? context.headline : "AstraSpin, sessão sorteada"}</p>
          </div>

          <div className="mt-5 flex gap-4 sm:gap-6">
            <div className="w-28 shrink-0 sm:w-36">
              {entry.poster ? (
                <img src={entry.poster} alt={`Pôster de ${entry.title}`} className="aspect-[2/3] w-full rounded-md object-cover shadow-lg" />
              ) : (
                <div className="grid aspect-[2/3] w-full place-items-center rounded-md bg-[#1b1512]/10 p-2 text-center text-sm font-semibold">
                  {entry.title}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black leading-[1.05] tracking-tight text-balance sm:text-4xl">{entry.title}</h2>

              <ul className="mt-3 flex flex-wrap gap-y-1 text-sm font-medium">
                {meta.map((m, i) => (
                  <li key={`${m}-${i}`} className={i ? "ml-3 border-l border-[#1b1512]/30 pl-3" : ""}>{m}</li>
                ))}
              </ul>

              {shown.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {shown.map((r) => (
                    <li key={r.label} className="inline-flex items-center gap-1 rounded-full border border-[#1b1512]/30 bg-[#1b1512]/5 px-2.5 py-1 text-xs font-medium">
                      <Check className="size-3" aria-hidden="true" />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5">
                {fit != null ? (
                  <>
                    <p className="text-xs font-medium">Afinidade com o que você pediu: {fit}%</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[#1b1512]/15">
                      <div className="h-full rounded-full bg-[#a61e2b]" style={{ width: `${fit}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-medium">Sorteio puro, sem filtros.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* canhoto */}
        <div className="relative flex flex-col gap-5 rounded-b-2xl border-t-2 border-dashed border-[#f7ecd6]/50 bg-[#a61e2b] p-5 text-[#f7ecd6] md:rounded-r-2xl md:rounded-bl-none md:border-l-2 md:border-t-0">
          <span className="absolute -left-3 -top-3 size-6 rounded-full bg-background" aria-hidden="true" />
          <span className="absolute -right-3 -top-3 size-6 rounded-full bg-background md:-bottom-3 md:-left-3 md:right-auto md:top-auto" aria-hidden="true" />

          <dl className="grid grid-cols-4 gap-3 md:grid-cols-2">
            <StubItem label="Sala" value={room} />
            <StubItem label="Poltrona" value={seat} />
            <StubItem label="Data" value={date} />
            <StubItem label="Sessão" value="Agora" />
          </dl>

          <div className="mt-auto">
            <Barcode seed={h} />
            <p className="mt-2 font-mono text-xs tracking-wider">{code}</p>
          </div>
        </div>
      </article>

      {/* ações */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="lg" className="gap-2" onClick={() => onPlay(entry.movie)}>
          <Play className="size-5" aria-hidden="true" />
          Assistir agora
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={() => onDetails(entry.movie)}>
          <Info className="size-5" aria-hidden="true" />
          Ver detalhes
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={() => onToggleList(entry.movie)}>
          {inList ? <BookmarkCheck className="size-5" aria-hidden="true" /> : <Bookmark className="size-5" aria-hidden="true" />}
          {inList ? "Na minha lista" : "Salvar na lista"}
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={onRespin}>
          <RotateCw className="size-5" aria-hidden="true" />
          Não é esse, girar de novo
        </Button>
      </div>
    </div>
  );
}