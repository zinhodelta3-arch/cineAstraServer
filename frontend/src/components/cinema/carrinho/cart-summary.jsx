import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ResumoCompra from "@/components/cinema/card/resumocompra";
import { money } from "./cart-utils";
import { checkoutStorageKey } from "@/lib/api/checkout-storage.mjs";

export default function CartSummary({ items, itemCount, total, quote, pending, error, issue, session, coupon, setCoupon, calculate }) {
  const loginHref = "/auth/login?next=%2Fcinema%2Fcarrinho";
  const customer = session.user?.role === "CLIENTE";
  const hasCoupon = Boolean(coupon.trim());
  const couponApplied = hasCoupon && quote?.couponCode === coupon.trim().toUpperCase();
  const paymentLink = () => {
    try { sessionStorage.setItem(checkoutStorageKey("coupon", session.user.id), couponApplied ? quote.couponCode : ""); } catch { /* Cupom opcional. */ }
  };
  return <ResumoCompra
    items={items}
    itemCount={itemCount}
    total={total}
    totalLabel={quote ? "TOTAL COTADO" : "TOTAL ESTIMADO"}
    totalNote="A oferta e a disponibilidade serão confirmadas na próxima etapa."
    action={!session.loading && !session.user
      ? <Link className={buttonVariants()} href={loginHref}>Entrar para continuar <ArrowRight className="size-4" /></Link>
      : issue || !customer || (hasCoupon && !couponApplied)
      ? <Button disabled>Continuar para pagamento <ArrowRight className="size-4" /></Button>
      : <Link href="/cinema/pagamento" className={buttonVariants()} onClick={paymentLink}>Continuar para pagamento <ArrowRight className="size-4" /></Link>}
    footerContent={<Link href="/cinema/astrasnack" className="mt-4 block text-center text-xs text-secondary-foreground underline underline-offset-4">Continuar comprando</Link>}
  >
    <div className="mt-5 border-t border-dashed border-border pt-4 text-xs">
      <div className="flex justify-between gap-3"><span>Quantidade</span><strong>{itemCount}</strong></div>
      <div className="mt-3 flex justify-between gap-3"><span>Taxas</span><strong>{quote ? money(Number(quote.fees)) : "A consultar"}</strong></div>
    </div>
    {customer && <label className="mt-5 block text-xs font-semibold">Cupom (opcional)<Input className="mt-2" value={coupon} onChange={event => setCoupon(event.target.value)} maxLength={50} autoComplete="off" /></label>}
    {issue && <p role="alert" className="mt-4 text-xs text-destructive">{issue}</p>}
    {error && <p role="alert" className="mt-4 text-xs text-destructive">{error}</p>}
    {session.loading ? <p role="status" className="mt-4 text-xs">Verificando sua conta…</p> : customer ? <Button className="mt-4 w-full" onClick={calculate} disabled={pending || Boolean(issue)}>{hasCoupon ? (pending ? "Validando…" : "Validar cupom") : (pending ? "Consultando…" : "Consultar preço e estoque")}</Button> : session.user && <p className="mt-4 text-xs">Use uma conta de cliente para consultar o pedido.</p>}
    {couponApplied && <p role="status" className="mt-4 text-sm font-semibold text-primary">Cupom aplicado ao pedido.</p>}
    {quote && <p role="status" className="mt-4 text-xs leading-5">{quote.guardianAuthorizationRequired ? "Esta compra precisa de autorização do responsável." : quote.lines?.some(line => line.catalogOutOfSync) ? "O cinema precisa atualizar o preço de um dos itens." : quote.finalizable ? "Cotação recebida. Os produtos ainda não estão reservados." : "A API não autorizou a finalização desta cotação."}</p>}
  </ResumoCompra>;
}
