import { ChevronDown } from "lucide-react"
import { FAQS } from "./data"

export default function PlansFaq({ faqOpen, toggleFaq }) {
  return (
      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
          <div className="mb-8 text-center"><div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Dúvidas frequentes</div><h2 className="f-display text-4xl font-black sm:text-5xl">Antes de dar o play.</h2></div>
          <div className="space-y-3">
            {FAQS.map(([q, a], index) => <div key={q} className="overflow-hidden rounded-xl border border-border/70 bg-card/70"><button type="button" aria-expanded={faqOpen === index} onClick={() => toggleFaq(index)} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-bold sm:p-5">{q}<ChevronDown className={`size-4 shrink-0 text-primary transition-transform ${faqOpen === index ? "rotate-180" : ""}`} /></button>{faqOpen === index && <div className="border-t border-dashed border-border px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-5">{a}</div>}</div>)}
          </div>
        </div>
      </section>
  )
}
