"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { youtubeEmbed } from "@/lib/api/youtube-embed.mjs";

export default function TrailerButton({ url, title, className, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const embed = youtubeEmbed(url);
  if (!embed) return null;

  return <Dialog open={open} onOpenChange={value => { setOpen(value); onOpenChange?.(value); }}>
    <DialogTrigger type="button" className={className}>Assistir trailer</DialogTrigger>
    <DialogContent initialFocus={closeRef} showCloseButton={false}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto border border-border bg-card sm:max-w-4xl">
      <DialogClose ref={closeRef} aria-label="Fechar trailer"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">
        <X size={20} aria-hidden="true" />
      </DialogClose>
      <div className="pr-12">
        <DialogTitle className="f-display text-2xl font-bold">{title}</DialogTitle>
        <DialogDescription>Trailer oficial</DialogDescription>
      </div>
      {open && <iframe src={`${embed}&autoplay=1`} title={`Trailer de ${title}`}
        className="aspect-video w-full rounded-md bg-black" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
    </DialogContent>
  </Dialog>;
}
