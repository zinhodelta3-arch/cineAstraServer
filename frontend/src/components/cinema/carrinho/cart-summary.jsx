import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ResumoCompra from "@/components/cinema/card/resumocompra";
import { money } from "./cart-utils";
import { checkoutStorageKey } from "@/lib/api/checkout-storage.mjs";

export default function CartSummary({ items, itemCount, total, quote, pending, error, issue, session, coupon, setCoupon, validateCoupon, couponState, baseTotal, retryQuote }) {
  const loginHref = "/auth/login?next=%2Fcinema%2Fcarrinho";
  const customer = session.user?.role === "CLIENTE";
  const hasCoupon = Boolean(coupon.trim());
  const couponApplied = Boolean(couponState?.quote);
  const couponSavings = couponApplied && baseTotal != null ? Math.max(0, Math.round((Number(baseTotal) - Number(quote.total)) * 100)) / 100 : null;
  const checkoutReady = quote?.finalizable && !quote.lines?.some(line => line.catalogOutOfSync) && !pending && !error && !couponState?.pending;
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
      : issue || !customer || !checkoutReady || (hasCoupon && !couponApplied)
      ? <Button disabled>Continuar para pagamento <ArrowRight className="size-4" /></Button>
      : <Link href="/cinema/pagamento" className={buttonVariants()} onClick={paymentLink}>Continuar para pagamento <ArrowRight className="size-4" /></Link>}
    footerContent={<Link href="/cinema/astrasnack" className="mt-4 block text-center text-xs text-secondary-foreground underline underline-offset-4">Continuar comprando</Link>}
  >
    <div className="mt-5 border-t border-dashed border-border pt-4 text-xs">
      <div className="flex justify-between gap-3"><span>Quantidade</span><strong>{itemCount}</strong></div>
      <div className="mt-3 flex justify-between gap-3"><span>Taxas</span><strong>{quote ? money(Number(quote.fees)) : "A consultar"}</strong></div>
    </div>
    {customer && <form className="mt-5" onSubmit={event => { event.preventDefault(); validateCoupon(); }}>
      <label className="block text-xs font-semibold">Cupom (opcional)
        <Input className="mt-2" value={coupon} onChange={event => setCoupon(event.target.value)} maxLength={50} autoComplete="off"
          aria-invalid={Boolean(couponState?.error)} aria-describedby={couponState?.error ? "cart-coupon-error" : undefined} />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={!hasCoupon || pending || Boolean(issue) || couponState?.pending || couponApplied}>
          {couponState?.pending ? "Validando…" : "Validar cupom"}
        </Button>
        {hasCoupon && <Button type="button" variant="ghost" onClick={() => setCoupon("")}>Remover cupom</Button>}
      </div>
      {couponState?.error && <p id="cart-coupon-error" role="alert" className="mt-3 text-xs text-destructive">{couponState.error}</p>}
      {couponApplied && <p role="status" className="mt-3 text-xs font-semibold text-primary">{couponSavings === 0 ? "Cupom válido, sem desconto adicional neste pedido." : couponSavings ? `Cupom aplicado. Você economizou ${money(couponSavings)}.` : "Cupom aplicado."}</p>}
    </form>}
    {issue && <p role="alert" className="mt-4 text-xs text-destructive">{issue}</p>}
    {error && <div className="mt-4"><p role="alert" className="text-xs text-destructive">{error}</p><Button type="button" variant="outline" className="mt-2" onClick={retryQuote}>Tentar novamente</Button></div>}
    {(session.loading || pending) && <p role="status" className="mt-4 text-xs">{session.loading ? "Verificando sua conta…" : "Conferindo preço e disponibilidade…"}</p>}
    {!session.loading && session.user && !customer && <p className="mt-4 text-xs">Use uma conta de cliente para consultar o pedido.</p>}
    {quote && <p role="status" className="mt-4 text-xs leading-5">{quote.guardianAuthorizationRequired ? "Esta compra precisa de autorização do responsável." : quote.lines?.some(line => line.catalogOutOfSync) ? "O cinema precisa atualizar o preço de um dos itens." : quote.finalizable ? "Preço e disponibilidade conferidos. A reserva é feita no checkout." : "Revise os itens do carrinho para continuar."}</p>}
  </ResumoCompra>;
}
