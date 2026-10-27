import useStreamRow from "@/hooks/streaming/home/use-stream-row";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { ACCENT } from "./data";

export default function Row({ title, children, className = "" }) {
  const { ref, scroll } = useStreamRow();

  /* Setas discretas: pequenas, translúcidas, só aparecem ao passar o mouse na fileira */
  const arrowBase =
    "absolute inset-y-0 w-10 z-30 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity text-foreground/35 hover:text-foreground/80 outline-hidden";

  return (
    <section className={`group/row relative max-w-[1800px] mx-auto px-5 md:px-12 py-3 md:py-5 ${className}`}>
      <h2 className="f-display text-3xl md:text-4xl font-black text-foreground mb-3 flex items-center gap-2">
        <Ticket className={`size-5 ${ACCENT}`} aria-hidden="true" /> {title}
      </h2>
      <div className="relative">
        <button type="button" aria-label="Rolar para a esquerda" onClick={() => scroll(-1)} className={`${arrowBase} left-0 bg-linear-to-r from-background/40 to-transparent`}>
          <ChevronLeft className="size-6" strokeWidth={1.5} />
        </button>
        {/* overflow-y-hidden evita a barra de rolagem vertical (ex.: no Top 10) */}
        <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x py-3">{children}</div>
        <button type="button" aria-label="Rolar para a direita" onClick={() => scroll(1)} className={`${arrowBase} right-0 bg-linear-to-l from-background/40 to-transparent`}>
          <ChevronRight className="size-6" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
