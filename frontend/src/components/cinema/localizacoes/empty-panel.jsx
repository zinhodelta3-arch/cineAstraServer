"use client";

import VenueArt from "./venue-art";

export default function EmptyPanel() {
  return (
    <div className="bg-card/60 border-2 border-dashed border-border rounded-xl overflow-hidden">
      <div className="bulbs" aria-hidden="true" />
      <div className="aspect-[16/7] bg-muted"><VenueArt kind="marquee" className="w-full h-full" /></div>
      <div className="p-8 md:p-10 text-center">
        <h2 className="f-display text-3xl md:text-4xl font-black text-foreground leading-none">Escolha um cinema</h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
          Selecione um local na lista para ver o endereço e os horários de cada filme.
        </p>
      </div>
    </div>
  );
}
