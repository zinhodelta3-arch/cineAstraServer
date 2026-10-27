import useOrderDetails from "@/hooks/cinema/minhascompras/use-order-details";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { date, money, time } from "./purchase-data";
import PurchaseIcon from "./purchase-icon";
import StatusBadge from "./status-badge";
import Perforation from "./perforation";

export default function OrderDetails({ selection, onClose, focusRef, onDownload, onCopy, demo }) {
  const { order, view, subtotal, changeOpen } = useOrderDetails(selection, onClose);
  return <Dialog.Root open onOpenChange={changeOpen}><Dialog.Portal><Dialog.Backdrop className="cp-backdrop" /><Dialog.Popup className="cp-root cp-dialog" finalFocus={focusRef}>
    <Perforation /><div className="cp-dialog-header"><span className="cp-eyebrow"><PurchaseIcon name="archive" />{view === "tickets" ? "SEUS INGRESSOS" : "DETALHES DO PEDIDO"}</span><Dialog.Close className="cp-icon-button" aria-label="Fechar detalhes"><PurchaseIcon name="close" /></Dialog.Close></div>
    <Dialog.Title className="cp-dialog-title">{order.title}</Dialog.Title><Dialog.Description className="cp-dialog-description">Pedido {order.id} · {date(order.purchasedAt)} às {time(order.purchasedAt)}</Dialog.Description>
    <div className="cp-detail-meta"><StatusBadge status={order.status} /><button className="cp-copy-button" onClick={() => onCopy(order.id)}><PurchaseIcon name="copy" />Copiar código</button></div>
    {order.sessionAt && <section className="cp-detail-session" aria-label="Informações da sessão"><div><span>Sessão</span><strong>{date(order.sessionAt)} · {time(order.sessionAt)}</strong></div><div><span>Cinema</span><strong>{order.venue}</strong></div><div><span>Sala e formato</span><strong>{order.room} · {order.subtitle}</strong></div><div><span>Assentos</span><strong>{order.seats.join(" · ")}</strong></div></section>}
    {view === "tickets" && order.status === "confirmed" && <section className="cp-ticket-list" aria-label="Ingressos do pedido">{order.seats.map((seat, index) => <div className="cp-mini-ticket" key={seat}><div><span>INGRESSO {String(index + 1).padStart(2, "0")}</span><strong>{seat}</strong><small>ASSENTO</small></div><div><PurchaseIcon name="ticket" /><span>{demo ? "Exemplo visual de ingresso" : "Ingresso do pedido"}</span><code>{order.id} / {seat}</code></div></div>)}</section>}
    {order.access && <p className="cp-access-note"><PurchaseIcon name="play" />{order.access}</p>}
    {order.refund && <p className="cp-refund-box"><PurchaseIcon name="check" />{order.refund}</p>}
    <div className="cp-detail-grid"><section className="cp-detail-items" aria-labelledby="cp-items-title"><h3 id="cp-items-title">Resumo da compra</h3>{order.items.map((item, index) => <div className="cp-item-line" key={index}><span><b>{item.quantity}×</b>{item.label}</span><strong>{money(item.quantity * item.unitPrice)}</strong></div>)}<div className="cp-totals"><div><span>Subtotal</span><span>{money(subtotal)}</span></div><div><span>Taxa de serviço</span><span>{money(order.fee)}</span></div>{order.discount > 0 && <div className="cp-discount"><span>{order.discountLabel || "Desconto"}</span><span>− {money(order.discount)}</span></div>}<div className="cp-final-total"><span>{order.status === "canceled" ? "Total estornado" : "Total pago"}</span><strong>{money(order.total)}</strong></div></div></section>
    <section className="cp-payment" aria-labelledby="cp-payment-title"><h3 id="cp-payment-title">Pagamento</h3><PurchaseIcon name="card" /><strong>{order.payment}</strong><span>{order.paymentDetail}</span><p>{order.status === "canceled" ? "Pedido cancelado e valor devolvido." : "Pagamento aprovado."}</p></section></div>
    <section className="cp-timeline" aria-label="Histórico do pedido">{order.timeline.map((item, i) => <div key={i}><span className="cp-timeline-dot" /><strong>{item.title}</strong><span>{date(item.at, { year: undefined })} · {time(item.at)}</span></div>)}</section>
    <div className="cp-dialog-footer"><span className="cp-summary-note">Resumo do pedido, sem valor fiscal.</span><Button className="cp-btn cp-btn-primary" onClick={() => onDownload(order)}><PurchaseIcon name="download" />Baixar resumo</Button></div>
  </Dialog.Popup></Dialog.Portal></Dialog.Root>;
}
