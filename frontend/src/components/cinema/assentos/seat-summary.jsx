import { ArrowRight } from "lucide-react";
import ResumoCompra from "@/components/cinema/card/resumocompra";

export default function SeatSummary({ session, selection }) {
  return <ResumoCompra
    session={session}
    seats={selection.selected}
    onRemoveSeat={selection.selectSeat}
    seatsDisabled={selection.continuing}
    totalLabel="PRÓXIMA ETAPA"
    totalNote="Escolha os tipos de ingresso e confira os valores na próxima etapa."
    action={<button type="button" disabled={!selection.selected.length || selection.continuing} onClick={selection.continueToTickets}>{selection.continuing ? "Abrindo ingressos…" : "Continuar"}<ArrowRight size={18} aria-hidden="true" /></button>}
    footerContent={selection.error && <p className="mt-3 text-xs" role="alert">{selection.error}</p>}
  />;
}
