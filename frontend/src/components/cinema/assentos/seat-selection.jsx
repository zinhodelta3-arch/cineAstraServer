"use client";

import SeatSummary from "./seat-summary";
import SeatTypes from "./seat-types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCheckoutSession } from "@/hooks/use-checkout-session";
import { useSeatSelection } from "@/hooks/cinema/sessao/use-seat-selection";
import { DEMO_SESSION } from "@/components/checkout/ticket-state.mjs";
import SeatMap from "./seat-map";
import styles from "./seat-selection.module.css";

const EMPTY_SESSION = { ...DEMO_SESSION, seats: [] };

function Selection({ session }) {
  const selection = useSeatSelection(session);
  return (
    <main className={styles.page}>
      <div className={styles.perforation} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.topbar}>
          <Link href="/cinema/filmes" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Voltar aos filmes</Link>
          <ol className={styles.steps} aria-label="Etapas da compra"><li aria-current="step"><span>1</span>Assentos</li><li><span>2</span>Ingressos</li><li><span>3</span>Pedido</li></ol>
        </div>
        <div className={styles.layout}>
          <div className={styles.stage}>
            <header className={styles.heading}><h1>Escolha seu <em>lugar.</em></h1><p>Uma boa história começa com o seu lugar na sala.</p></header>
            <div className={styles.mapHeading}><h2>Selecione seus assentos</h2><span>{session.cinema.room} · {session.format}</span></div>
            <SeatMap selection={selection} />
<SeatTypes />
            <p className={styles.demo}>Planta e disponibilidade demonstrativas. Esta seleção não reserva lugares no cinema.</p>
          </div>
<SeatSummary session={session} selection={selection} />
        </div>
      </div>
    </main>
  );
}

export default function SeatSelection() {
  const session = useCheckoutSession(EMPTY_SESSION);
  return <Selection key={`${session.id}:${session.seats.join(",")}`} session={session} />;
}
