import { Film } from "lucide-react";
import { ACCENT } from "./data";

export default function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-10 flex items-start gap-4">
      <div className="hidden sm:block perf-v self-stretch rounded-xs" aria-hidden="true" />
      <div>
        <div className={`flex items-center gap-2 text-sm font-semibold ${ACCENT} mb-1`}>
          <Film className="size-4" aria-hidden="true" /> {eyebrow}
        </div>
        <h2 className="f-display text-5xl md:text-7xl font-black text-foreground leading-[0.95]">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}
