"use client";

import { VenueImg } from "./location-images";

export default function EmptyPanel() {
  return (
    <div className="bg-card/60 border-2 border-dashed border-border rounded-xl overflow-hidden">
      <div className="bulbs" aria-hidden="true" />
      <div className="relative aspect-[16/7] bg-muted">
        <VenueImg src="/parcerias/tela-cinema.jpg" kind="marquee" className="absolute inset-0 object-[center_45%]" />
        <span className="absolute right-3 bottom-3 rounded bg-background px-2 py-1 text-xs text-foreground">Imagem ilustrativa</span>
      </div>
      <div className="p-8 md:p-10 text-center">
        <h2 className="f-display text-3xl md:text-4xl font-black text-foreground leading-none">Escolha um cinema</h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
          Selecione um local na lista para ver o endereço e os horários de cada filme.
        </p>
      </div>
    </div>
  );
}
