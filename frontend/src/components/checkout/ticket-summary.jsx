import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResumoCompra from "@/components/cinema/card/resumocompra";

export default function TicketSummary({ session, imageFailed, failImage, seatCount, count, selected, selection, complete, remaining, total, submitting, continueOrder, message }) {
  const tickets = selected.map(type => ({ id: type.id, name: type.name, quantity: selection[type.id], price: selection[type.id] * type.price / 100 }));
  return <ResumoCompra
    session={session}
    posterFailed={imageFailed}
    onPosterError={failImage}
    tickets={tickets}
    ticketCount={count}
    ticketStatus={complete ? <><Check size={14} aria-hidden="true" /> Todos os assentos têm ingresso.</> : <>Falta{remaining === 1 ? "" : "m"} {remaining} ingresso{remaining === 1 ? "" : "s"} para completar.</>}
    total={total / 100}
    totalLabel="TOTAL DOS INGRESSOS"
    totalNote={`${count} de ${seatCount} ingressos selecionados`}
    action={<Button disabled={!complete || submitting} onClick={continueOrder}>{submitting ? "Continuando…" : "Continuar"}<ArrowRight size={18} aria-hidden="true" /></Button>}
    footerContent={message && <p className="mt-3 text-xs" role="alert">{message}</p>}
  />;
}
