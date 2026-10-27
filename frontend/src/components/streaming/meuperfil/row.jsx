import useStreamRow from "@/hooks/streaming/home/use-stream-row";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { ACCENT } from "./data";

export default function Row({ title, hint, children }) {
  const { ref, scroll } = useStreamRow();
  const arrow = "absolute inset-y-0 w-10 z-30 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity text-foreground/40 hover:text-foreground/90 outline-hidden";

  return (
    <section className="group/row relative py-3 md:py-4">
      <h2 className="f-display text-3xl md:text-4xl font-black text-foreground flex items-center gap-2">
        <Ticket className={`size-5 ${ACCENT}`} aria-hidden="true" /> {title}
      </h2>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
      <div className="relative mt-3">
        <button type="button" aria-label="Rolar para a esquerda" onClick={() => scroll(-1)} className={`${arrow} left-0 bg-linear-to-r from-background/50 to-transparent`}><ChevronLeft className="size-6" strokeWidth={1.5} /></button>
        <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x py-3">{children}</div>
        <button type="button" aria-label="Rolar para a direita" onClick={() => scroll(1)} className={`${arrow} right-0 bg-linear-to-l from-background/50 to-transparent`}><ChevronRight className="size-6" strokeWidth={1.5} /></button>
      </div>
    </section>
  );
}
