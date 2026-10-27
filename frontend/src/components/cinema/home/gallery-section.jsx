"use client";

import { GALLERY } from "./data";
import { SmartImg, SectionTitle } from "./home-ui";

export default function GallerySection() {
  return (
    <section id="galeria" className="relative py-24 bg-background">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Conheça o espaço" title="Dentro do CineAstra" description="Salas, poltronas, projeção e bomboniere: cada detalhe pensado para a sua sessão." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {GALLERY.map((g) => (
            <figure key={g.id} style={{ "--n": "50%" }} className="ticket ticket-v group relative overflow-hidden border border-border bg-card aspect-[4/5]">
              <SmartImg src={g.image} alt={g.title} title={g.title} icon={g.icon} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 poster-scrim" aria-hidden="true" />
              <figcaption className="absolute inset-x-0 bottom-0 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1"><g.icon className="w-3.5 h-3.5" aria-hidden="true" />{g.title}</span>
                <p className="text-xs text-muted-foreground leading-snug">{g.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
