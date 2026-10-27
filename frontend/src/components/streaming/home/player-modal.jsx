import useEscape from "@/hooks/streaming/home/use-escape";
import { X } from "lucide-react";
import { ACCENT, TRAILER } from "./data";

export default function PlayerModal({ movie, onClose }) {
  useEscape(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Assistindo ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`text-xs font-semibold ${ACCENT} block`}>Reproduzindo</span>
            <h3 className="f-display text-3xl font-black text-foreground">{movie.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-muted-foreground hover:text-foreground rounded-full"><X className="size-6" /></button>
        </div>
        <div className="flex gap-2 bg-card p-3 rounded-md border border-border">
          <div className="perf-v hidden sm:block rounded-xs" aria-hidden="true" />
          <div className="aspect-video w-full bg-black">
            <iframe src={`${TRAILER}?autoplay=1`} title={movie.title} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <div className="perf-v hidden sm:block rounded-xs" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
