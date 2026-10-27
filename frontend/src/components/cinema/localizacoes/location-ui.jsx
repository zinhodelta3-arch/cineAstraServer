"use client";

import { AGE_STYLES } from "./data";

export function Button({ children, variant = "default", size = "default", className = "", type = "button", ...props }) {
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ";
  if (variant === "default") base += "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 ";
  if (variant === "wine") base += "bg-secondary text-secondary-foreground hover:opacity-90 ";
  if (variant === "outline") base += "border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary ";
  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  return <button type={type} className={`${base} ${className}`} {...props}>{children}</button>;
}

export function AgeBadge({ age }) {
  return <span aria-label={`Classificação ${age}`} className={`inline-flex min-w-[28px] h-6 px-1.5 items-center justify-center rounded-md text-xs font-bold ${AGE_STYLES[age] || "bg-muted text-foreground"}`}>{age}</span>;
}
