"use client";

import usePurchaseHistory from "@/hooks/cinema/minhascompras/use-purchase-history";
import "./purchases.css";
import { Button } from "@/components/ui/button";
import { DEMO_ORDERS, DEMO_REFERENCE_DATE } from "./purchase-data";
import PurchaseIcon from "./purchase-icon";
import Perforation from "./perforation";
import UpcomingTicket from "./upcoming-ticket";
import OrderDetails from "./order-details";
import PurchaseFilters from "./purchase-filters";
import PurchaseOrderList from "./purchase-order-list";
import PurchaseHeader from "./purchase-header";

export default function PurchaseHistory({ orders = DEMO_ORDERS, referenceDate = DEMO_REFERENCE_DATE, demo = true }) {
  const { filters, visible, selection, notice, returnFocus, matching, upcoming, shown, groups, isFiltered, change, clear, open, copy, download, loadMore, close, dismissNotice, typeTabs } = usePurchaseHistory(orders, referenceDate);
  return <main className="cp-root cp-page"><div className="cp-grain" aria-hidden="true" /><div className="cp-container">
    <nav className="cp-breadcrumb" aria-label="Você está em"><span>Minha conta</span><PurchaseIcon name="chevron" /><span aria-current="page">Minhas compras</span></nav>
    <PurchaseHeader orders={orders} demo={demo} />
    {upcoming && <UpcomingTicket order={upcoming} onOpen={open} />}
    <section className="cp-history" aria-labelledby="cp-history-heading"><div className="cp-history-heading"><h2 id="cp-history-heading"><PurchaseIcon name="archive" />Histórico de pedidos</h2><span>{orders.length} {orders.length === 1 ? "história registrada" : "histórias registradas"}</span></div>
    <PurchaseFilters filters={filters} typeTabs={typeTabs} change={change} matching={matching} isFiltered={isFiltered} clear={clear} />
    <PurchaseOrderList groups={groups} matching={matching} orders={orders} isFiltered={isFiltered} clear={clear} open={open} />
      {matching.length > 0 && <div className="cp-pagination"><span>Exibindo {shown.length} de {matching.length} pedidos</span>{visible < matching.length ? <Button className="cp-btn cp-btn-outline" variant="outline" onClick={loadMore}>Carregar mais pedidos<PurchaseIcon name="down" /></Button> : <span className="cp-end-history"><PurchaseIcon name="check" />Você chegou ao início dessa história.</span>}</div>}
    </section>
    <footer className="cp-page-footer"><span>CINEASTRA <b>✦</b> ALÉM DA TELA</span><Perforation /><span>SEU ARQUIVO. SUAS HISTÓRIAS.</span></footer>
  </div>{selection && <OrderDetails selection={selection} onClose={close} focusRef={returnFocus} onDownload={download} onCopy={copy} demo={demo} />}<div className={`cp-toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">{notice && <><PurchaseIcon name="check" /><span>{notice}</span><button className="cp-icon-button" aria-label="Fechar aviso" onClick={dismissNotice}><PurchaseIcon name="close" /></button></>}</div></main>;
}
