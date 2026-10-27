import { Button } from "@/components/ui/button";
import { date, money, time } from "./purchase-data";
import PurchaseIcon from "./purchase-icon";
import Poster from "./poster";
import StatusBadge from "./status-badge";

export default function OrderRow({ order, onOpen }) {
  return <article className="cp-order">
    <Poster order={order} />
    <div className="cp-order-main"><div className="cp-order-top"><span className="cp-type"><PurchaseIcon name={order.type === "cinema" ? "ticket" : "play"} />{order.type === "cinema" ? "CINEMA" : "STREAMING"}</span><span className="cp-code">{order.id}</span></div><h3>{order.title}</h3><p>{order.subtitle}</p><span className="cp-order-date">Comprado em {date(order.purchasedAt, { year: undefined })} · {time(order.purchasedAt)}</span></div>
    <div className="cp-order-status"><StatusBadge status={order.status} />{order.status === "canceled" && <span className="cp-refund-note">Valor estornado</span>}</div>
    <div className="cp-order-total"><span>{order.status === "canceled" ? "Total estornado" : "Total pago"}</span><strong>{money(order.total)}</strong></div>
    <Button variant="ghost" className="cp-btn cp-btn-details" aria-label={`Ver detalhes do pedido ${order.id}`} onClick={(e) => onOpen(order, e.currentTarget)}><span>Detalhes</span><PurchaseIcon name="arrow" /></Button>
  </article>;
}
