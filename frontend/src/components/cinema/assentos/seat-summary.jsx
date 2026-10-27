import { Armchair, ArrowRight, CalendarDays, Clock3, Film, MapPin, X } from "lucide-react";
import styles from "./seat-selection.module.css";
import Image from "next/image";

export default function SeatSummary({ session, selection }) {
  return (
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
  );
}
