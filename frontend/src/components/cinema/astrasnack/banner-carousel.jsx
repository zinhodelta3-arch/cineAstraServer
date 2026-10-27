"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANNERS } from "./data";
import { useSnackBanner } from "@/hooks/cinema/astrasnack/use-snack-banner";

export default function BannerCarousel() {
  const { current, setCurrent, banner, previous, next } = useSnackBanner();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
      <div className="relative min-h-[420px] md:min-h-[520px]">
        {BANNERS.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ${index === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <img
              src={item.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
          </div>
        ))}

        <div className="astra-perf absolute top-0 right-0 left-0 z-10 h-5 text-white/20" />

        <div className="relative z-10 flex min-h-[420px] items-end p-6 md:min-h-[520px] md:p-10">
          <div className="max-w-2xl text-white">
            <div className="mb-2 text-[10px] font-bold tracking-[.3em] text-primary uppercase">
              {banner.eyebrow}
            </div>
            <h2 className="f-display text-4xl font-black leading-none md:text-6xl">
              {banner.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 md:text-base">
              {banner.description}
            </p>
          </div>
        </div>

        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/60 hover:text-white"
            onClick={previous}
            aria-label="Banner anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/60 hover:text-white"
            onClick={next}
            aria-label="Próximo banner"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="absolute bottom-6 left-6 z-20 flex gap-1.5 md:left-10">
          {BANNERS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir para o banner ${index + 1}`}
              onClick={() => setCurrent(index)}
              className={`h-1.5 rounded-full transition-all ${index === current ? "w-8 bg-primary" : "w-2 bg-white/45"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
