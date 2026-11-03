"use client";

import { useId, useState } from "react";
import { Armchair, CalendarDays, Clock3, Film, MapPin, ShoppingBag, Ticket } from "lucide-react";
import Barcode from "@/components/checkout/barcode";
import styles from "./resumocompra.module.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ItemThumbnail({ item }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <div className={styles.thumbnail}>{item.image && !imageFailed ? <img src={item.image} alt="" onError={() => setImageFailed(true)} /> : item.type === "ticket" ? <Ticket size={25} aria-hidden="true" /> : <ShoppingBag size={25} aria-hidden="true" />}</div>;
}

export default function ResumoCompra({
  session, seats, onRemoveSeat, seatsDisabled = false, posterFailed = false, onPosterError,
  tickets, ticketCount, ticketStatus, items, itemCount, children,
  total, totalLabel = "TOTAL DA COMPRA", totalNote, action, footerContent, className = "",
}) {
  const id = useId();
  const [failedPoster, setFailedPoster] = useState(false);
  const selectedSeats = seats ?? session?.seats ?? [];
  const showItems = items !== undefined;
  const showTickets = tickets !== undefined;

  return (
    <aside className={`${styles.card} ${className}`} aria-labelledby={`${id}-title`}>
      <div className={styles.content}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}><Ticket size={15} aria-hidden="true" /> {session ? "SUA PRÓXIMA SESSÃO" : "SEU PEDIDO"}</span>
          <h2 id={`${id}-title`}>Resumo da compra<span className={styles.period}>.</span></h2>
        </div>

        {session && <>
          <section className={styles.movie} aria-label="Filme escolhido">
            <div className={styles.poster}>
              {session.movie.poster && !posterFailed && !failedPoster ? <img src={session.movie.poster} alt={`Imagem de ${session.movie.title}`} onError={() => { setFailedPoster(true); onPosterError?.(); }} /> : <Film size={35} aria-hidden="true" />}
              <span className={styles.posterCaption} aria-hidden="true">CINE<br />ASTRA</span>
            </div>
            <div><span className={styles.smallLabel}>O FILME</span><h3>{session.movie.title}</h3>{session.movie.genre && <p>{session.movie.genre}</p>}<div className={styles.filmMeta}>{session.movie.rating && <span className={styles.age} aria-label={`Classificação: ${session.movie.rating} anos`}>{session.movie.rating}</span>}<span>{session.format}</span><span>{session.language}</span></div></div>
          </section>
          <section className={styles.section} aria-labelledby={`${id}-session`}>
            <h3 id={`${id}-session`}><MapPin size={16} aria-hidden="true" /> Cinema e sessão</h3>
            <p className={styles.cinemaName}>{session.cinema.name}</p>
            <p>{session.cinema.room} · {session.format} · {session.language}</p>
            <div className={styles.sessionDate}><span><CalendarDays size={14} aria-hidden="true" /> {session.dateLabel}</span><span><Clock3 size={14} aria-hidden="true" /> {session.time}</span></div>
          </section>
          <section className={styles.section} aria-labelledby={`${id}-seats`}>
            <div className={styles.sectionLine}><h3 id={`${id}-seats`}><Armchair size={16} aria-hidden="true" /> Seus assentos</h3><span className={styles.smallLabel}>{selectedSeats.length} {selectedSeats.length === 1 ? "LUGAR" : "LUGARES"}</span></div>
            {selectedSeats.length ? <ul className={styles.seatTags}>{selectedSeats.map(seat => <li key={seat}>{onRemoveSeat ? <button type="button" disabled={seatsDisabled} onClick={() => onRemoveSeat(seat)} aria-label={`Remover assento ${seat}`}><Armchair size={15} aria-hidden="true" /> {seat} <span aria-hidden="true">×</span></button> : <span><Armchair size={15} aria-hidden="true" /> {seat}</span>}</li>)}</ul> : <p>Escolha no mapa os lugares para a sua sessão.</p>}
          </section>
        </>}

        {showTickets && <section className={styles.section} aria-labelledby={`${id}-tickets`}>
          <div className={styles.sectionLine}><h3 id={`${id}-tickets`}><Ticket size={16} aria-hidden="true" /> Ingressos</h3><span className={styles.count}>{ticketCount}/{selectedSeats.length}</span></div>
          {tickets.length ? <ul className={styles.lines}>{tickets.map(ticket => <li key={ticket.id}><span><b>{ticket.quantity}×</b> {ticket.name}</span><strong>{money(ticket.price)}</strong></li>)}</ul> : <p>Sua sessão já tem lugar.<br />Agora só falta escolher a entrada.</p>}
          {ticketStatus && <p className={styles.status} role="status">{ticketStatus}</p>}
        </section>}

        {showItems && <section className={styles.section} aria-labelledby={`${id}-items`}>
          <div className={styles.sectionLine}><h3 id={`${id}-items`}><ShoppingBag size={16} aria-hidden="true" /> Itens do pedido</h3><span className={styles.count}>{itemCount} {itemCount === 1 ? "ITEM" : "ITENS"}</span></div>
          {items.length ? <ul className={styles.items}>{items.map(item => <li key={JSON.stringify([item.type, item.id, item.details])} className={styles.item}>
            <ItemThumbnail item={item} />
            <div className={styles.itemInfo}><h4>{item.name}</h4>{item.description && <p>{item.description}</p>}{item.details && <p>{item.details}</p>}<span>{item.quantity} × {money(item.price)}</span><strong>{money(item.price * item.quantity)}</strong></div>
          </li>)}</ul> : <p>Seu carrinho está vazio.</p>}
        </section>}
        {children}
      </div>
      <div className={styles.footer}>
        <div className={styles.totalLine}><div><span className={styles.smallLabel}>{totalLabel}</span><strong className={styles.total}>{total == null ? "A escolher" : money(total)}</strong></div><Ticket size={29} strokeWidth={1.3} aria-hidden="true" /></div>
        {totalNote && <p className={styles.totalNote}>{totalNote}</p>}
        {action && <div className={styles.action}>{action}</div>}
        {footerContent}
        <div className={styles.stub}><Barcode /><span>UM LUGAR.<br />MIL HISTÓRIAS.</span></div>
      </div>
    </aside>
  );
}
