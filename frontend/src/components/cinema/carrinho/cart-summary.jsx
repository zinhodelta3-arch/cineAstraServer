import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ResumoCompra from "@/components/cinema/card/resumocompra";
import { money } from "./cart-utils";

export default function CartSummary({ items, itemCount, total, quote, pending, error, issue, session, coupon, setCoupon, calculate }) {
  return <ResumoCompra
    items={items}
    itemCount={itemCount}
    total={total}
    totalLabel={quote ? "TOTAL COTADO" : "TOTAL ESTIMADO"}
    totalNote="A oferta e a disponibilidade serão confirmadas na próxima etapa."
    action={issue
      ? <Button disabled>Continuar para pagamento <ArrowRight className="size-4" /></Button>
      : <Button nativeButton={false} render={<Link href="/cinema/pagamento" onClick={() => { try { sessionStorage.setItem("cineastra:checkout:coupon", coupon); } catch { /* Cupom opcional. */ } }} />}>Continuar para pagamento <ArrowRight className="size-4" /></Button>}
    footerContent={<Link href="/cinema/astrasnack" className="mt-4 block text-center text-xs text-secondary-foreground underline underline-offset-4">Continuar comprando</Link>}
  >
    <div className="mt-5 border-t border-dashed border-border pt-4 text-xs">
      <div className="flex justify-between gap-3"><span>Quantidade</span><strong>{itemCount}</strong></div>
      <div className="mt-3 flex justify-between gap-3"><span>Taxas</span><strong>{quote ? money(Number(quote.fees)) : "A consultar"}</strong></div>
    </div>
    <label className="mt-5 block text-xs font-semibold">Cupom (opcional)<Input className="mt-2" value={coupon} onChange={event => setCoupon(event.target.value)} maxLength={50} autoComplete="off" /></label>
    {issue && <p role="alert" className="mt-4 text-xs text-destructive">{issue}</p>}
    {error && <p role="alert" className="mt-4 text-xs text-destructive">{error}</p>}
    {session.loading ? <p role="status" className="mt-4 text-xs">Verificando sua conta…</p> : !session.user ? <Link className="mt-4 block text-xs text-primary underline" href="/auth/login">Entrar para consultar preço e estoque</Link> : session.user.role !== "CLIENTE" ? <p className="mt-4 text-xs">Use uma conta de cliente para consultar o pedido.</p> : <Button className="mt-4 w-full" onClick={calculate} disabled={pending || Boolean(issue)}>{pending ? "Consultando…" : quote ? "Atualizar cotação" : "Consultar preço e estoque"}</Button>}
    {quote && <p role="status" className="mt-4 text-xs leading-5">{quote.guardianAuthorizationRequired ? "Esta compra precisa de autorização do responsável." : quote.finalizable ? "Cotação recebida. Os produtos ainda não estão reservados." : "A API não autorizou a finalização desta cotação."}</p>}
  </ResumoCompra>;
}
