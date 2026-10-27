"use client";

import { ArrowRight, Check } from "lucide-react";
import { FEATURES } from "./data";
import { SmartImg, Button, SectionTitle } from "./home-ui";
import { useHomeExperience } from "@/hooks/cinema/home/use-home-experience";

export default function ExperienceSection() {
  const { tab, setTab, item } = useHomeExperience();

  return (
    <section id="experiencia" className="grain edge-fade-top edge-fade-bottom relative py-28 bg-gradient-to-b from-background via-card/70 to-background overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
        <SectionTitle eyebrow="Tecnologia de ponta" title="A experiência CineAstra" description="Transformamos o simples ato de ir ao cinema em uma jornada sensorial, com os mais elevados padrões mundiais." />

        <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
          {Object.entries(FEATURES).map(([key, f]) => (
            <Button key={key} variant={tab === key ? "wine" : "outline"} onClick={() => setTab(key)} className={`shrink-0 ${tab === key ? "border border-primary/40 !text-primary" : ""}`}>
              <f.icon className="w-4 h-4 mr-2" aria-hidden="true" /> {f.label}
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <h3 className="f-display text-5xl md:text-6xl font-black text-foreground leading-[0.95] mb-4">{item.title}</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">{item.description}</p>
            <div className="space-y-3 mb-8">
              {item.tags.map((tag) => (
                <div key={tag} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"><Check className="w-3 h-3" aria-hidden="true" /></span>
                  {tag}
                </div>
              ))}
            </div>
            <Button>Conhecer programação VIP <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" /></Button>
          </div>

          <div className="lg:col-span-7">
            <div className="screen-curve overflow-hidden border-t-4 border-x-4 border-border bg-background aspect-[16/8] relative">
              <SmartImg src={item.image} alt={item.title} title={item.label} icon={item.icon} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
            </div>
            <div className="mx-auto w-[88%] h-6 bg-gradient-to-b from-primary/20 to-transparent blur-md" aria-hidden="true" />
            <div className="mt-3 flex flex-col items-center gap-2" aria-hidden="true">
              {[10, 12, 14].map((n) => (
                <div key={n} className="flex gap-2">{Array.from({ length: n }).map((_, i) => <span key={i} className="seat" />)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
