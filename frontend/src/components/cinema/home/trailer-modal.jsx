"use client";

import { X } from "lucide-react";
import { useEscapeClose } from "@/hooks/cinema/home/use-escape-close";

export default function TrailerModal({ movie, onClose }) {
  useEscapeClose(onClose);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Trailer de ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-primary block">Trailer oficial</span>
            <h3 className="f-display text-3xl font-black text-foreground">{movie.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-muted-foreground hover:text-foreground rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-2 bg-card p-3 rounded-md border border-border">
          <div className="perf-v hidden sm:block rounded-sm" aria-hidden="true" />
          <div className="aspect-video w-full bg-black">
            <iframe src={`${movie.trailerUrl}?autoplay=1`} title={movie.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <div className="perf-v hidden sm:block rounded-sm" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
