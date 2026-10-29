"use client";

import Footer from "@/components/Footer";
import CinemaStyles from "./cinema-styles";
import LocationPanel from "./location-panel";
import EmptyPanel from "./empty-panel";
import LocationList from "./location-list";
import { useCinemaLocations } from "@/hooks/cinema/localizacoes/use-cinema-locations";

export default function CinemasPage() {
  const locations = useCinemaLocations();
  const { selected, panelRef } = locations;

  return (
    <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
      <CinemaStyles />

      <section className="grain relative bg-background pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 hero-tint" aria-hidden="true" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-5 md:px-8">
          <h1 className="f-display text-4xl sm:text-6xl lg:text-[5rem] font-black text-foreground uppercase leading-[0.9] mb-3">Nossos cinemas</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
            Escolha um cinema para consultar o endereço, as salas e a programação cadastrada.
          </p>
        </div>
        <div className="bulbs absolute bottom-0 inset-x-0" aria-hidden="true" />
      </section>

      <section className="relative pt-7 pb-12 bg-background" aria-label="Cinemas e programação">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 grid lg:grid-cols-[360px_1fr] gap-6 xl:gap-8 items-start">
          <LocationList locations={locations} />

          <div ref={panelRef} className="scroll-mt-24 min-w-0" aria-live="polite">
            {selected ? <LocationPanel key={selected.id} loc={selected} /> : <EmptyPanel />}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}