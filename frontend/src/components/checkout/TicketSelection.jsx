"use client";

import useTicketSelection from "@/hooks/cinema/sessao/use-ticket-selection";
import "./ticket-selection.css";
import { ArrowLeft, Armchair, Check, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TICKET_TYPES } from "./ticket-state.mjs";
import FilmRibbon from "./film-ribbon";
import TicketCard from "./ticket-card";
import TicketSummary from "./ticket-summary";
import TicketInfoDialog from "./ticket-info-dialog";

export default function TicketSelection({ session, onBack, onContinue }) {
  const { selection, info, message, submitting, imageFailed, count, total, seatCount, remaining, complete, selected, change, setInfo, continueOrder, failImage, closeInfo, changeInfoOpen } = useTicketSelection(session, onContinue);
  return (
    <div className="ca-checkout min-h-screen bg-background text-foreground">
      <div className="ca-perf ca-perf-top" aria-hidden="true" />
      <div className="ca-checkout-shell">
        <div className="ca-checkout-topbar">
          <Button variant="ghost" className="ca-back" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" /> Voltar aos assentos</Button>
          <nav aria-label="Etapas da compra"><ol className="ca-steps"><li className="is-done"><span><Check size={13} aria-hidden="true" /></span>Assentos</li><li className="is-current" aria-current="step"><span>02</span>Ingressos</li><li><span>03</span>Pagamento</li></ol></nav>
        </div>

        <div className="ca-checkout-grid">
          <main className="ca-ticket-stage" id="escolher-ingressos">
            <FilmRibbon />
            <div className="ca-ticket-stage-content">
              <header className="ca-stage-heading"><p className="ca-eyebrow"><span className="ca-scene-number">CENA 02</span> O PRÓXIMO PASSO DA SUA HISTÓRIA</p><h1>ESCOLHA SEUS<br /><span>INGRESSOS</span><span className="ca-period">.</span></h1><p>O lugar já é seu. Escolha como entrar nessa história.</p></header>
              <div className={`ca-progress${complete ? " is-complete" : ""}`}><span className="ca-progress-icon">{complete ? <Check size={17} aria-hidden="true" /> : <Armchair size={18} aria-hidden="true" />}</span><div><strong>{complete ? "Tudo certo para a sua sessão" : `Um ingresso para cada assento`}</strong><p>{complete ? "Você já pode continuar com a compra." : `Escolha ${seatCount} ${seatCount === 1 ? "ingresso" : "ingressos"}. Pode combinar tipos diferentes.`}</p></div><span className="ca-progress-count">{String(count).padStart(2, "0")}<i>/ {String(seatCount).padStart(2, "0")}</i></span></div>
              <section className="ca-ticket-group" aria-labelledby="ca-regular-heading"><div className="ca-group-heading"><h2 id="ca-regular-heading">Inteira</h2><span>O INGRESSO CLÁSSICO</span><div aria-hidden="true" /></div><TicketCard type={TICKET_TYPES[0]} count={selection.inteira} selectedCount={count} seatCount={seatCount} onChange={change} onInfo={setInfo} large /></section>
              <section className="ca-ticket-group ca-half-group" aria-labelledby="ca-half-heading"><div className="ca-group-heading"><h2 id="ca-half-heading">Meia entrada</h2><span>BENEFÍCIOS QUE ABREM A CENA</span><div aria-hidden="true" /></div><div className="ca-half-grid">{TICKET_TYPES.slice(1).map((type) => <TicketCard key={type.id} type={type} count={selection[type.id]} selectedCount={count} seatCount={seatCount} onChange={change} onInfo={setInfo} />)}</div></section>
              <details className="ca-benefit-details"><summary><span><Info size={17} aria-hidden="true" /> Vai de meia entrada ou benefício?</span><ChevronDown size={17} className="ca-details-chevron" aria-hidden="true" /></summary><div><p>Leve um documento válido que comprove seu benefício e apresente-o na entrada do cinema. No caso de parceria, confira também a elegibilidade e as formas de pagamento aceitas.</p><p>Use o ícone de informação em cada ingresso para consultar suas condições.</p></div></details>
              <footer className="ca-stage-footer"><span className="ca-stage-wordmark">CINE<span>ASTRA</span><i>✦</i></span><span>APAGAM-SE AS LUZES. COMEÇAM AS HISTÓRIAS.</span></footer>
            </div>
          </main>

<TicketSummary session={session} imageFailed={imageFailed} failImage={failImage} seatCount={seatCount} count={count} selected={selected} selection={selection} complete={complete} remaining={remaining} total={total} submitting={submitting} continueOrder={continueOrder} message={message} />
        </div>
      </div>
<TicketInfoDialog info={info} changeInfoOpen={changeInfoOpen} closeInfo={closeInfo} />
    </div>
  );
}
