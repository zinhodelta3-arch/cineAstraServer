"use client";

import { Popcorn } from "lucide-react";

export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-[.24em] text-primary uppercase">
        <span className="h-px w-7 bg-primary" />
        {eyebrow}
      </div>
      <h2 className="f-display text-3xl font-black tracking-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export function EmptyProductStrip({ tone, count }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="astra-card group relative min-h-40 overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4"
        >
          <div
            className={[
              "mb-4 aspect-[4/3] rounded-lg border border-dashed border-border/70",
              tone === "cyan" && "bg-cyan-500/10",
              tone === "lilac" && "bg-fuchsia-400/10",
              tone === "yellow" && "bg-primary/10",
            ].filter(Boolean).join(" ")}
          >
            <div className="flex h-full items-center justify-center text-muted-foreground/35">
              <Popcorn className="size-9" />
            </div>
          </div>
          <div className="h-3 w-3/4 rounded bg-muted/70" />
          <div className="mt-2 h-2 w-1/2 rounded bg-muted/50" />
        </div>
      ))}
    </div>
  )
}
