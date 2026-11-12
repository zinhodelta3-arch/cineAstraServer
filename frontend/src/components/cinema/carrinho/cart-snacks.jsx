import Link from 'next/link';
import { Plus, Popcorn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartSnacks } from '@/hooks/cinema/carrinho/use-cart-snacks';
import ProductPrice from '../astrasnack/product-price';

export default function CartSnacks({ session, coupon, enabled }) {
  const { localId, products, add, snacks, combos, themed, tickets, selectedSession, setSelectedSession, pending, error, notice } = useCartSnacks(session, coupon, enabled);
  if (!localId) return null;
  const loading = snacks.loading || combos.loading || themed.loading;
  const failed = snacks.error || combos.error || themed.error;

  return <section aria-labelledby="cart-snacks-title" className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-4 sm:p-5">
    <h2 id="cart-snacks-title" className="f-display flex items-center gap-2 text-2xl font-bold"><Popcorn className="size-5 text-primary" aria-hidden="true" /> AstraSnack para sua sessão</h2>
    <p className="mt-1 text-sm text-muted-foreground">Escolha produtos da unidade do ingresso e pague tudo no mesmo pedido.</p>
    {tickets.length > 1 && <label className="mt-3 grid gap-1 text-sm">
      Sessão dos combos temáticos
      <select className="min-w-0 rounded-md border border-border bg-background px-3 py-2" value={selectedSession} disabled={Boolean(pending)} onChange={event=>setSelectedSession(event.target.value)}>
        {tickets.map(ticket=><option key={ticket.sourceId} value={ticket.sourceId}>{ticket.description || ticket.name} · sessão #{ticket.sourceId}</option>)}
      </select>
    </label>}
    {loading && <p className="mt-3 text-sm" role="status">Consultando o catálogo da unidade…</p>}
    {failed && <div className="mt-3">
      <p className="text-sm text-destructive" role="alert">Parte do catálogo está indisponível.</p>
      <Button type="button" size="sm" variant="outline" onClick={() => { for(const list of [snacks,combos,themed])if(list.error)list.retry(); }}>Tentar novamente</Button>
    </div>}
    {!loading && !failed && !products.length && <p className="mt-3 text-sm text-muted-foreground">Nenhum complemento disponível nesta unidade agora.</p>}
    {products.length > 0 && !session.loading && !session.user && <Link href="/auth/login" className="mt-3 inline-block text-sm font-semibold text-primary underline">Entrar para adicionar</Link>}
    {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
    {notice && <p className="mt-3 text-sm font-semibold text-primary" role="status">{notice}</p>}
    {products.length > 0 && <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {products.map(product => <li className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-3" key={product.id}>
        <div className="flex min-w-0 items-start gap-3">
          {product.image && <img src={product.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-md object-cover" />}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{product.category}</p>
            <h3 className="break-words text-sm font-semibold">{product.name}</h3>
            {product.customerLimit && <p className="text-xs text-muted-foreground">Até {product.customerLimit} por cliente</p>}
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 text-sm">
          <ProductPrice price={product.price} note="Preço de catálogo" />
          {session.user?.role === 'CLIENTE' && <Button type="button" size="sm" variant="outline" disabled={Boolean(pending)} onClick={() => add(product)} aria-label={pending === product.id ? `Consultando ${product.name}` : `Adicionar ${product.name}`}>
            <Plus className="size-4" aria-hidden="true" />{pending === product.id ? 'Consultando…' : 'Adicionar'}
          </Button>}
        </div>
      </li>)}
    </ul>}
  </section>;
}
