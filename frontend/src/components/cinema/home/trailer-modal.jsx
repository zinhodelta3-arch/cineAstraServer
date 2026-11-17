"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { youtubeEmbed } from "@/lib/api/youtube-embed.mjs";
import ticket from "../ticket.module.css";

export default function TrailerButton({ url, title, className, onOpenChange, ticketStyle = false }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const embed = youtubeEmbed(url);
  if (!embed) return null;

  return <Dialog open={open} onOpenChange={value => { setOpen(value); onOpenChange?.(value); }}>
    <DialogTrigger type="button" className={className}>Assistir trailer</DialogTrigger>
    <DialogContent initialFocus={closeRef} showCloseButton={false}
      className={`max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card motion-reduce:animate-none sm:max-w-4xl ${ticketStyle ? "gap-0 rounded-md p-0" : "border border-border"}`}>
      <DialogClose ref={closeRef} aria-label="Fechar trailer"
        className={`absolute right-4 z-10 grid size-11 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary ${ticketStyle ? "top-5" : "top-4"}`}>
        <X size={20} aria-hidden="true" />
      </DialogClose>
      <div className={ticketStyle ? `${ticket.ticket} overflow-hidden` : "contents"}>
        <div className={ticketStyle ? "grid gap-3 px-4 pt-4 pb-5 sm:px-6" : "contents"}>
          <div className="min-w-0 pr-12">
            <DialogTitle className={ticketStyle ? `${ticket.title} text-3xl font-black sm:text-4xl` : "f-display text-2xl font-bold"}>{title}</DialogTitle>
            <DialogDescription className={ticketStyle ? "mt-1" : undefined}>Trailer oficial</DialogDescription>
          </div>
          {open && <iframe src={`${embed}&autoplay=1`} title={`Trailer de ${title}`}
            className="aspect-video min-h-[200px] w-full rounded-md bg-black" allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
        </div>
        {ticketStyle && <>
          <div className={ticket.tear} aria-hidden="true" />
          <div className={`${ticket.stub} h-4`} aria-hidden="true" />
        </>}
      </div>
    </DialogContent>
  </Dialog>;
}
