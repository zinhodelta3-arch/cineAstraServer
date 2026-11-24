import { Children } from "react";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { ACCENT } from "./data";

export default function Row({ title, children, emptyMessage, hint, className = "" }) {
  const { listRef, scroll, back, next } = useHorizontalScroll(Children.count(children));
  const control = "grid size-10 place-items-center rounded-md border border-border bg-background hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40";

  return (
    <section className={`group/row relative max-w-[1800px] mx-auto px-5 md:px-12 py-3 md:py-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="f-display flex items-center gap-2 text-3xl font-black text-foreground md:text-4xl"><Ticket className={`size-5 shrink-0 ${ACCENT}`} aria-hidden="true" /> {title}</h2>
        {!emptyMessage&&(back||next)&&<div className="flex shrink-0 gap-2">
          <button type="button" className={control} onClick={()=>scroll(-1)} disabled={!back} aria-label={`Anteriores em ${title}`}><ChevronLeft size={20} aria-hidden="true"/></button>
          <button type="button" className={control} onClick={()=>scroll(1)} disabled={!next} aria-label={`Próximos em ${title}`}><ChevronRight size={20} aria-hidden="true"/></button>
        </div>}
      </div>
      {hint && <p className="mb-2 text-sm text-muted-foreground">{hint}</p>}
      {emptyMessage ? <p className="py-5 text-sm leading-relaxed text-muted-foreground border-b border-dashed border-border">{emptyMessage}</p> : <div className="relative">
        <div ref={listRef} className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden snap-x py-3">{children}</div>
      </div>}
    </section>
  );
}
