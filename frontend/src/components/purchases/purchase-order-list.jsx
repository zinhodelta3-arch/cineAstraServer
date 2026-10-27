import { Button } from "@/components/ui/button";
import { month } from "./purchase-data";
import PurchaseIcon from "./purchase-icon";
import OrderRow from "./order-row";

export default function PurchaseOrderList({ groups, matching, orders, isFiltered, clear, open }) {
  return <>
      <div className="cp-order-list">{Array.from(groups.entries()).map(([label, group]) => <section key={label} className="cp-month-group" aria-label={label}><div className="cp-month-heading"><h3>{label}</h3><span /><PurchaseIcon name="film" /></div>{group.map((order) => <OrderRow key={order.id} order={order} onOpen={open} />)}</section>)}{matching.length === 0 && <div className="cp-empty"><PurchaseIcon name={orders.length ? "search" : "ticket"} /><h3>{orders.length ? "Nenhuma história por esse filtro." : "Sua primeira história começa em breve."}</h3><p>{orders.length ? "Tente outro título, código ou período para encontrar sua compra." : "Quando você fizer uma compra no CineAstra, os detalhes aparecerão aqui."}</p>{isFiltered && <Button className="cp-btn cp-btn-outline" variant="outline" onClick={clear}>Limpar filtros</Button>}</div>}</div>
  </>;
}
