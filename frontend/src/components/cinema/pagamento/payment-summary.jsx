import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResumoCompra from "@/components/cinema/card/resumocompra";
import styles from "./payment.module.css";

export default function PaymentSummary({ payment, method }) {
  const { items, itemCount, total, issue, offer, offerLoading, offerError, accepted, setAccepted, pending, error, result, refreshPayment, session } = payment;
  const isCard = method === "credito" || method === "debito";
  const canPay = Boolean(isCard && payment.ready && !pending && !result?.paymentId);
  return <ResumoCompra
    items={items}
    itemCount={itemCount}
    total={total}
    totalLabel={offer ? "TOTAL DA OFERTA" : "TOTAL ESTIMADO"}
    totalNote={offer?.contract?.offer?.conditions}
    action={isCard && !["PAGO", "FINALIZADO"].includes(result?.orderStatus) && <Button type="submit" form="payment-card-form" size="lg" disabled={!canPay}>{pending ? "Processando…" : "Confirmar pagamento"}<ArrowRight size={17} /></Button>}
    footerContent={<Link href="/cinema/carrinho" className="mt-5 block text-center text-xs text-secondary-foreground underline underline-offset-4">Editar meu carrinho</Link>}
  >
    {!items.length && !result && <Link href="/cinema/carrinho" className={styles.inlineLink}>Voltar ao carrinho <ArrowRight size={15} /></Link>}
    {issue && !["PAGO", "FINALIZADO"].includes(result?.orderStatus) && <p role="alert" className={styles.error}>{issue}</p>}
    {offerLoading && <p role="status" className={styles.summaryHint}>Consultando preço e disponibilidade…</p>}
    {offerError && <p role="alert" className={styles.error}>{offerError}</p>}
    {!session.loading && !session.user && <p className={styles.summaryHint}><Link href="/auth/login" className={styles.inlineLink}>Entre na sua conta</Link> para finalizar.</p>}
    {offer && !offer.finalizable && <p role="alert" className={styles.error}>{offer.guardianAuthorizationRequired ? "Esta compra exige autorização do responsável." : offer.lines?.some(line => line.catalogOutOfSync) ? "O cinema precisa atualizar o preço de um dos itens." : "A oferta não pode ser finalizada. Revise o carrinho."}</p>}
    {!method && offer?.contract && <div id="payment-consent" className={styles.consent}>
      <h3>Antes de escolher</h3>
      {[offer.contract.business, offer.contract.terms, offer.contract.privacy].map(document => <details key={document.slug} className={styles.document}><summary>{document.title}</summary><p>{document.body.text}</p></details>)}
      <label className={styles.acceptance}><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />Li e aceito a oferta, os termos e a política de privacidade.</label>
    </div>}
    {method && !accepted && offer && <p className={styles.error}>Aceite a oferta na <Link href="/cinema/pagamento" className={styles.inlineLink}>seleção de pagamento</Link> para continuar.</p>}
    {isCard && error && <p role="alert" className={styles.error}>{error}</p>}
    {isCard && result && <div role="status" className={styles.paymentResult}><strong>Pedido #{result.orderId}</strong><span>Pagamento: {result.status}</span><span>Pedido: {result.orderStatus}</span>{["PAGO", "FINALIZADO"].includes(result.orderStatus) ? <Link href="/cinema/minhascompras">Ver meus pedidos e ingressos <ArrowRight size={15} /></Link> : result.paymentId && <Button type="button" variant="outline" onClick={() => refreshPayment(result.paymentId)}>Atualizar status</Button>}</div>}
  </ResumoCompra>;
}
