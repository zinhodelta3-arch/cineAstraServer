"use client";

import SeatSummary from "./seat-summary";
import SeatTypes from "./seat-types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSessionSeatData } from "@/hooks/cinema/sessao/use-session-seat-data";
import { useSeatSelection } from "@/hooks/cinema/sessao/use-seat-selection";
import SeatMap from "./seat-map";
import styles from "./seat-selection.module.css";

function Selection({ session }) {
  const selection = useSeatSelection(session);
  return (
    <main className={styles.page}>
      <div className={styles.perforation} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.topbar}>
          <Link href={`/cinema/filmes/${session.movie.id || ""}`} className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Voltar ao filme</Link>
          <ol className={styles.steps} aria-label="Etapas da compra"><li aria-current="step"><span>1</span>Assentos</li><li><span>2</span>Ingressos</li><li><span>3</span>Pedido</li></ol>
        </div>
        <div className={styles.layout}>
          <div className={styles.stage}>
            <header className={styles.heading}><h1>Escolha seu <em>lugar.</em></h1><p>Uma boa história começa com o seu lugar na sala.</p></header>
            <div className={styles.mapHeading}><h2>Selecione seus assentos</h2><span>{session.cinema.room} · {session.format}</span></div>
            <SeatMap selection={selection} seats={session.seatMap} />
<SeatTypes />
            <p className={styles.demo}>Disponibilidade consultada agora. Os assentos são reservados somente ao confirmar o pedido.</p>
          </div>
<SeatSummary session={session} selection={selection} />
        </div>
      </div>
    </main>
  );
}

export default function SeatSelection({ sessionId }) {
  const { session, loading, error } = useSessionSeatData(sessionId);
  if (loading) return <main className={styles.page} role="status">Carregando assentos da sessão…</main>;
  if (error || !session) return <main className={styles.page} role="alert">{error || "Sessão indisponível."} <Link href="/cinema/filmes">Voltar aos filmes</Link></main>;
  return <Selection key={session.id} session={session} />;
}
