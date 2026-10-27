import { ChevronDown, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TICKETS } from "./data";
import SectionHeading from "./section-heading";
import Modal from "./modal";
import TicketRow from "./ticket-row";

export default function ProfileTickets() {
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><SectionHeading icon={Ticket} title="Ingressos ativos" count={TICKETS.length}><span className="hidden text-[10px] text-muted-foreground sm:block">Sua próxima sessão espera por você</span></SectionHeading><div className="space-y-3">{TICKETS.slice(0, 2).map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div><Modal trigger={<Button variant="ghost" className="mt-4 h-8 w-full rounded-full text-[11px] text-muted-foreground">Ver todos os ingressos<ChevronDown className="size-3.5" /></Button>} title="Ingressos ativos" description="Confira seus ingressos confirmados para as próximas sessões." wide><div className="space-y-3">{TICKETS.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div></Modal></section>;
}
