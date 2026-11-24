import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroArrow({ dir, onClick }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Filme anterior" : "Próximo filme"}
      className="grid size-11 place-items-center rounded-lg border border-border bg-card text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
