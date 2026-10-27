import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroArrow({ dir, onClick }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Filme anterior" : "Próximo filme"}
      className={`absolute top-1/2 -translate-y-1/2 z-30 hidden sm:flex size-8 items-center justify-center rounded-full border border-foreground/10 bg-transparent text-foreground/30 transition-all hover:bg-background/50 hover:text-foreground/80 hover:border-foreground/30 outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:text-foreground/80 ${dir === "prev" ? "left-1 md:left-2" : "right-1 md:right-2"}`}
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
