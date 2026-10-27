"use client";

import { Film } from "lucide-react";
import VenueArt from "./venue-art";
import { useLocationImage } from "@/hooks/cinema/localizacoes/use-location-image";

export function VenueImg({ src, kind, alt = "", className = "" }) {
  const { failed, onError } = useLocationImage(src);
  if (failed || !src) return <VenueArt kind={kind} className={`w-full h-full ${className}`} />;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={onError} className={`w-full h-full object-cover ${className}`} />;
}

export function PosterImg({ src, title }) {
  const { failed, onError } = useLocationImage(src);
  if (failed || !src) {
    return <div role="img" aria-label={title} className="w-full h-full bg-gradient-to-br from-secondary via-card to-background flex items-center justify-center"><Film className="w-5 h-5 text-primary/60" aria-hidden="true" /></div>;
  }
  return <img src={src} alt={`Pôster de ${title}`} loading="lazy" onError={onError} className="w-full h-full object-cover" />;
}
