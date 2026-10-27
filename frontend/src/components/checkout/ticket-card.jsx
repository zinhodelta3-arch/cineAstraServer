import { Ticket, Plus, Minus, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "./ticket-state.mjs";

export default function TicketCard({ type, count, selectedCount, seatCount, onChange, onInfo, large = false }) {
  const selected = count > 0;
  const remaining = seatCount - selectedCount;
  return (
    <article className={`ca-ticket${large ? " ca-ticket-large" : ""}${selected ? " is-selected" : ""}`} aria-label={type.name}>
      <div className="ca-ticket-inner">
        <div className="ca-ticket-main">
          <div className="ca-ticket-top"><span className="ca-ticket-type"><Ticket size={16} aria-hidden="true" /> {type.partner ? "PARCERIA CINEASTRA" : "CINEASTRA · CINEMA"}</span><span className="ca-ticket-code">{type.code}</span></div>
          <div className="ca-ticket-name-row"><h3>{type.name}</h3><Button variant="ghost" className="ca-info-button" onClick={() => onInfo(type)} aria-label={`Condições de ${type.name}`}><Info size={17} aria-hidden="true" /></Button></div>
          <p className="ca-ticket-tagline">{type.label}</p>
          <div className="ca-ticket-bottom"><div><span className="ca-price">{brl(type.price)}</span><span className="ca-price-unit">por pessoa</span></div><span className="ca-ticket-mark" aria-hidden="true">{type.partner ? "nu" : <Ticket size={29} strokeWidth={1.3} />}</span></div>
        </div>
        <div className="ca-ticket-stub">
          <span className="ca-stub-caption">QUANTIDADE</span>
          <div className="ca-counter" role="group" aria-label={`Quantidade de ${type.name}`}>
            <Button variant="outline" className="ca-counter-button" disabled={count === 0} onClick={() => onChange(type.id, -1)} aria-label={`Remover uma ${type.name.toLowerCase()}`}><Minus size={17} aria-hidden="true" /></Button>
            <output className="ca-counter-value" aria-label={`${count} ingressos de ${type.name}`}>{String(count).padStart(2, "0")}</output>
            <Button variant="outline" className="ca-counter-button" disabled={remaining <= 0} onClick={() => onChange(type.id, 1)} aria-label={`Adicionar uma ${type.name.toLowerCase()}`}><Plus size={17} aria-hidden="true" /></Button>
          </div>
          <span className="ca-stub-end">{selected ? <><Check size={13} aria-hidden="true" /> No pedido</> : "ADMIT ONE"}</span>
        </div>
      </div>
    </article>
  );
}
