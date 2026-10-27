"use client";

import { Film } from "lucide-react";
import { useImageFallback } from "@/hooks/cinema/home/use-image-fallback";

export const Barcode = ({ seed = 7, className = "h-10" }) => (
  <div className={`flex items-end gap-[2px] ${className}`} aria-hidden="true">
    {Array.from({ length: 34 }).map((_, i) => (
      <span key={i} className="bg-foreground/70" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
    ))}
  </div>
);

export function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}

export function SectionDivider() {
  return <div className="section-sep mx-auto max-w-[1600px]" aria-hidden="true" />;
}

/* Imagem com carregamento lento e fallback elegante (nunca mostra o ícone de imagem quebrada) */
export function SmartImg({ src, alt = "", title = "", icon: Icon, className = "w-full h-full object-cover" }) {
  const { failed, onError } = useImageFallback(src);

  if (failed || !src) {
    return (
      <div role="img" aria-label={alt || title} className={`${className} relative flex items-end p-3 bg-gradient-to-br from-secondary via-card to-background`}>
        {Icon && <Icon className="absolute top-3 right-3 w-8 h-8 text-primary/60" aria-hidden="true" />}
        <span className="f-display text-sm sm:text-base font-black uppercase leading-tight text-foreground/90 line-clamp-3">{title}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={onError} className={className} />;
}

export function Button({ children, variant = "default", size = "default", className = "", type = "button", ...props }) {
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ";

  if (variant === "default") base += "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 ";
  if (variant === "wine") base += "bg-secondary text-secondary-foreground hover:opacity-90 ";
  if (variant === "outline") base += "border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary ";
  if (variant === "ghost") base += "text-muted-foreground hover:text-foreground hover:bg-muted/50 ";
  if (variant === "link") base += "text-primary hover:underline p-0 h-auto ";

  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  if (size === "lg") base += "px-8 py-4 text-base ";
  if (size === "icon") base += "p-2.5 ";

  return <button type={type} className={`${base} ${className}`} {...props}>{children}</button>;
}

export function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-10 flex items-start gap-4">
      <div className="hidden sm:block perf-v self-stretch rounded-sm" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
          <Film className="w-4 h-4" aria-hidden="true" /> {eyebrow}
        </div>
        <h2 className="f-display text-5xl md:text-7xl font-black text-foreground leading-[0.95]">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}
