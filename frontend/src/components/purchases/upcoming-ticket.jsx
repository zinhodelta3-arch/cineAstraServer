import { Button } from "@/components/ui/button";
import { date, month, time } from "./purchase-data";
import PurchaseIcon from "./purchase-icon";
import Poster from "./poster";
import StatusBadge from "./status-badge";

export default function UpcomingTicket({ order, onOpen }) {
  return <section className="cp-upcoming" aria-labelledby="cp-upcoming-title">
    <div className="cp-upcoming-label"><span className="cp-live-dot" /><span>SUA PRÓXIMA SESSÃO</span><span className="cp-upcoming-note">Pode preparar a pipoca.</span></div>
    <div className="cp-ticket">
      <Poster order={order} large />
      <div className="cp-ticket-main"><div className="cp-ticket-meta"><span className="cp-type"><PurchaseIcon name="ticket" />CINEMA</span><StatusBadge status={order.status} /></div><h2 id="cp-upcoming-title">{order.title}</h2><p className="cp-ticket-format">{order.subtitle}</p><div className="cp-session-info"><span><PurchaseIcon name="calendar" /><strong>{date(order.sessionAt, { day: "2-digit", month: "long", year: undefined })}</strong> às {time(order.sessionAt)}</span><span><PurchaseIcon name="location" />{order.venue}</span></div><span className="cp-seat-line">{order.room}<i />Assentos <strong>{order.seats.join(" · ")}</strong></span></div>
      <div className="cp-ticket-stub"><span className="cp-stub-label">O SEU LUGAR JÁ ESTÁ RESERVADO</span><div><span className="cp-stub-seats">{order.seats.length.toString().padStart(2, "0")}</span><span className="cp-stub-tickets">INGRESSOS</span></div><Button className="cp-btn cp-btn-primary" onClick={(e) => onOpen(order, e.currentTarget, "tickets")}><PurchaseIcon name="ticket" />Ver ingressos<PurchaseIcon name="arrow" /></Button><span className="cp-code">{order.id}</span></div>
    </div>
  </section>;
}
