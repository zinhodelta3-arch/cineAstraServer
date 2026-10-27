import { BENEFITS } from "./data"

export default function ExperienceBenefits() {
  return (
      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 md:px-10 md:py-16">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5" /></div>
              <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </section>
  )
}
