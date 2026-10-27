import Link from "next/link";
import { ArrowRight, ShoppingBag, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "../carrinho/cart-utils";
import styles from "./payment.module.css";

export default function PaymentSummary({ items, itemCount, total, error }) {
  return <aside className={styles.summary} aria-labelledby="payment-cart-title">
    <div className={styles.summaryHeading}><h2 id="payment-cart-title">Carrinho</h2><span>{itemCount} {itemCount === 1 ? "item" : "itens"}</span></div>
    {items.length ? <ul className={styles.items}>{items.map((item) => <li key={JSON.stringify([item.type, item.id, item.details])} className={styles.item}>
      <div className={styles.thumbnail}>{item.image ? <img src={item.image} alt="" width={72} height={80} /> : item.type === "ticket" ? <Ticket size={26} /> : <ShoppingBag size={26} />}</div>
      <div className={styles.itemInfo}><h3>{item.name}</h3>{item.details && <p>{item.details}</p>}<p>Quantidade: {item.quantity}</p><strong>{money(item.price * item.quantity)}</strong></div>
    </li>)}</ul> : <div className={styles.empty}><ShoppingBag size={32} /><h3>Seu carrinho está vazio</h3><p>Escolha seus ingressos ou snacks para continuar.</p><Link href="/cinema/astrasnack">Explorar AstraSnack <ArrowRight size={15} /></Link></div>}
    <div className={styles.total}><span>Total parcial</span><strong>{money(total)}</strong></div>
    <p className={styles.summaryHint}>Taxas e condições finais serão definidas na integração de pagamento.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <Button type="submit" form="payment-details-form" size="lg" disabled={!items.length} className="mt-5 h-12 w-full rounded-full font-bold">Confirmar pagamento <ArrowRight size={17} /></Button>
    <p className={styles.demoNote}>Demonstração: nenhuma cobrança será realizada.</p>
    <Link href="/cinema/carrinho" className={styles.editCart}>Editar meu carrinho</Link>
  </aside>;
}
