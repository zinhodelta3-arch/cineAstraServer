"use client";

import Image from "next/image";
import Link from "next/link";
import { Accessibility, Armchair, ArrowLeft, ArrowRight, CalendarDays, Clock3, Film, MapPin, X } from "lucide-react";
import { useCheckoutSession } from "@/hooks/use-checkout-session";
import { useSeatSelection } from "@/hooks/use-seat-selection";
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
            <section className={styles.types} aria-labelledby="seat-types"><h2 id="seat-types">Tipos de assento</h2><div className={styles.typeList}>
              <div><Armchair size={32} aria-hidden="true" /><div><h3>Normal</h3><p>Poltrona padrão para aproveitar cada cena.</p></div></div>
              <div><Accessibility size={32} aria-hidden="true" /><div><h3>Acessível</h3><p>Espaço reservado para pessoas com deficiência ou mobilidade reduzida.</p></div></div>
            </div></section>
            <p className={styles.demo}>Planta e disponibilidade demonstrativas. Esta seleção não reserva lugares no cinema.</p>
          </div>
          <aside className={styles.summary} aria-labelledby="summary-title">
            <div className={styles.summaryBody}>
              <h2 id="summary-title">Resumo da compra</h2>
              <div className={styles.movie}>
                <div className={styles.poster}>{session.movie.poster?.startsWith("/") ? <Image src={session.movie.poster} alt={`Cartaz de ${session.movie.title}`} fill sizes="80px" /> : <Film size={30} aria-hidden="true" />}</div>
                <div><h3>{session.movie.title}</h3><p>{session.movie.genre}</p><p>{session.movie.duration}{session.movie.rating ? ` · ${session.movie.rating} anos` : ""}</p><span className={styles.format}>{session.format} · {session.language}</span></div>
              </div>
              <section className={styles.detail}><MapPin size={20} aria-hidden="true" /><div><h3>Cinema</h3><p>{session.cinema.name}</p><span>{session.cinema.room}</span></div></section>
              <section className={styles.detail}><CalendarDays size={20} aria-hidden="true" /><div><h3>Dia e horário</h3><p>{session.dateLabel}</p><span className={styles.time}><Clock3 size={14} aria-hidden="true" />{session.time}</span></div></section>
              <section className={styles.chosen} aria-labelledby="selected-title"><div><h3 id="selected-title">Seus assentos</h3><span aria-live="polite">{selection.selected.length} {selection.selected.length === 1 ? "selecionado" : "selecionados"}</span></div>
                {selection.selected.length ? <ul>{selection.selected.map((id) => <li key={id}><button type="button" disabled={selection.continuing} onClick={() => selection.selectSeat(id)} aria-label={`Remover assento ${id}`}><Armchair size={14} aria-hidden="true" />{id}<X size={12} aria-hidden="true" /></button></li>)}</ul> : <p>Escolha no mapa os lugares para a sua sessão.</p>}
              </section>
            </div>
            <div className={styles.summaryBottom}>
              <p>Na próxima etapa, escolha os tipos de ingresso e confira os valores.</p>
              <button className={styles.continue} type="button" disabled={!selection.selected.length || selection.continuing} onClick={selection.continueToTickets}>{selection.continuing ? "Abrindo ingressos…" : "Continuar"}<ArrowRight size={18} aria-hidden="true" /></button>
              {selection.error && <p className={styles.error} role="alert">{selection.error}</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function SeatSelection() {
  const session = useCheckoutSession(EMPTY_SESSION);
  return <Selection key={`${session.id}:${session.seats.join(",")}`} session={session} />;
}
