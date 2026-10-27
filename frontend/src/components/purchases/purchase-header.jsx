import PurchaseIcon from "./purchase-icon";

export default function PurchaseHeader({ orders, demo }) {
  return <>
    <header className="cp-page-heading"><div><p className="cp-eyebrow"><PurchaseIcon name="film" />O SEU ARQUIVO DE BOAS HISTÓRIAS</p><h1>Minhas <em>compras.</em></h1><p className="cp-page-description">Os filmes passam. As boas histórias ficam por aqui.</p></div><div className="cp-archive-count"><span className="cp-archive-number">{String(orders.length).padStart(2, "0")}</span><div><span>PEDIDOS NO</span><strong>seu arquivo</strong>{demo && <small>Dados de demonstração</small>}</div></div></header>
  </>;
}
