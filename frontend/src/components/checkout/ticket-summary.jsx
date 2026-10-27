import { ArrowRight, Ticket, Film, MapPin, Armchair, Check, CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "./ticket-state.mjs";
import Barcode from "./barcode";

export default function TicketSummary({ session, imageFailed, failImage, seatCount, count, selected, selection, complete, remaining, total, submitting, continueOrder, message }) {
  return (
          <aside className="ca-summary" aria-labelledby="ca-summary-title">
            <div className="ca-summary-content">
              <div className="ca-summary-heading"><span className="ca-eyebrow"><Ticket size={15} aria-hidden="true" /> SUA PRÓXIMA SESSÃO</span><h2 id="ca-summary-title">Resumo da compra<span className="ca-period">.</span></h2></div>
              <section className="ca-summary-movie" aria-label="Filme escolhido">
                <div className="ca-movie-poster">{session.movie.poster && !imageFailed ? <img src={session.movie.poster} alt={`Imagem de ${session.movie.title}`} onError={failImage} /> : <Film size={35} aria-hidden="true" />}<span className="ca-poster-caption" aria-hidden="true">CINE<br />ASTRA</span></div>
                <div><span className="ca-small-label">O FILME</span><h3>{session.movie.title}</h3><p>{session.movie.genre}</p><div className="ca-film-meta"><span className="ca-age" aria-label={`Classificação: ${session.movie.rating} anos`}>{session.movie.rating}</span><span>{session.format}</span><span>{session.language}</span></div></div>
              </section>
              <section className="ca-summary-section" aria-labelledby="ca-session-title"><h3 id="ca-session-title"><MapPin size={16} aria-hidden="true" /> Cinema e sessão</h3><p className="ca-cinema-name">{session.cinema.name}</p><p>{session.cinema.room} <span aria-hidden="true">·</span> {session.format} <span aria-hidden="true">·</span> {session.language}</p><div className="ca-session-date"><span><CalendarDays size={14} aria-hidden="true" /> {session.dateLabel}</span><span><Clock3 size={14} aria-hidden="true" /> {session.time}</span></div></section>
              <section className="ca-summary-section" aria-labelledby="ca-seats-title"><div className="ca-section-line"><h3 id="ca-seats-title"><Armchair size={16} aria-hidden="true" /> Seus assentos</h3><span className="ca-small-label">{seatCount} {seatCount === 1 ? "LUGAR" : "LUGARES"}</span></div><div className="ca-seat-tags">{session.seats.map((seat) => <span key={seat}><Armchair size={15} aria-hidden="true" /> {seat}</span>)}</div></section>
              <section className="ca-summary-section ca-summary-tickets" aria-labelledby="ca-tickets-title"><div className="ca-section-line"><h3 id="ca-tickets-title"><Ticket size={16} aria-hidden="true" /> Ingressos</h3><span className="ca-summary-count">{count}/{seatCount}</span></div>{selected.length ? <ul>{selected.map((type) => <li key={type.id}><span><b>{selection[type.id]}×</b> {type.name}</span><strong>{brl(selection[type.id] * type.price)}</strong></li>)}</ul> : <p className="ca-empty-summary">Sua sessão já tem lugar.<br />Agora só falta escolher a entrada.</p>}<p className="ca-selection-status" role="status">{complete ? <><Check size={14} aria-hidden="true" /> Todos os assentos têm ingresso.</> : <>Falta{remaining === 1 ? "" : "m"} {remaining} ingresso{remaining === 1 ? "" : "s"} para completar.</>}</p></section>
            </div>
            <div className="ca-summary-footer"><div className="ca-total-line"><div><span className="ca-small-label">TOTAL DOS INGRESSOS</span><span className="ca-summary-total">{brl(total)}</span></div><Ticket size={29} strokeWidth={1.3} aria-hidden="true" /></div><p className="ca-total-note">{count} de {seatCount} ingressos selecionados</p><Button className="ca-continue" disabled={!complete || submitting} onClick={continueOrder}>{submitting ? "Continuando…" : "Continuar"}<ArrowRight size={18} aria-hidden="true" /></Button>{message && <p className="ca-error" role="alert">{message}</p>}<div className="ca-summary-stub"><Barcode /><span>UM LUGAR.<br />MIL HISTÓRIAS.</span></div></div>
          </aside>
  );
}
