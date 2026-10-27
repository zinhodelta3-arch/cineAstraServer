import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, movieFor } from "./profile-utils";
import Modal from "./modal";
import PosterImage from "./poster-image";
import TicketDetails from "./ticket-details";

export default function TicketRow({ ticket }) {
  const movie = movieFor(ticket);
  return <article className="ca-ticket grid grid-cols-[56px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-border bg-background p-3 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-5 sm:p-4">
    <PosterImage movie={movie} className="h-20 rounded-md sm:h-22" /><div className="min-w-0"><div className="mb-1.5 flex flex-wrap items-center gap-2"><span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{ticket.room.split(" · ")[1]}</span><span className="flex items-center gap-1 text-[9px] text-muted-foreground"><Check className="size-3 text-primary" />Confirmado</span></div><h3 className="truncate text-sm font-bold" title={movie.title}>{movie.title}</h3><p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><CalendarDays className="size-3" />{ticket.date}<span>·</span>{ticket.time}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{ticket.venue} · Assentos {ticket.seats}</p></div>
    <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:flex-col sm:items-end sm:border-l sm:border-dashed sm:border-border sm:pl-5"><span className="text-sm font-bold">{money(ticket.total)}</span><Modal trigger={<Button variant="outline" size="sm" className="mt-1 rounded-full px-3 text-[10px]">Ver ingresso<ArrowRight className="size-3" /></Button>} title="Seu ingresso" description="Todos os detalhes da sua próxima sessão."><TicketDetails ticket={ticket} /></Modal></div>
  </article>;
}
