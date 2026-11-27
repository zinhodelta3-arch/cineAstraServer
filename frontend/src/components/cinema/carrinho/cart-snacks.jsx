import Link from 'next/link';
import { useState } from 'react';
import { Plus, Popcorn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartSnacks } from '@/hooks/cinema/carrinho/use-cart-snacks';
import ProductPrice from '../astrasnack/product-price';
import ProductImage from '../astrasnack/product-image';
import ListStatus from '../home/list-status';
import styles from './cart-layout.module.css';

const views = [
  { value: 'suggestions', label: 'Sugestões' },
  { value: 'inputs', label: 'Avulsos' },
  { value: 'combos', label: 'Combos' },
  { value: 'themed', label: 'Temáticos' },
];

export default function CartSnacks({ session, coupon, enabled, ticketItems = [] }) {
  const { localId, products, catalog, add, snacks, combos, themed, tickets, selectedSession, setSelectedSession, pending, error, notice } = useCartSnacks(session, coupon, enabled);
  const [view, setView] = useState('suggestions');
  if (!localId) return null;
  const shown = view==='suggestions' ? products : catalog[view];
  const page = {inputs:snacks,combos,themed}[view];
  const loading = snacks.loading || combos.loading || themed.loading;
  const failed = snacks.error || combos.error || themed.error;

  return <section aria-labelledby="cart-snacks-title" className={styles.snacks}>
    <header className={styles.snacksHead}>
      <h2 id="cart-snacks-title" className={"f-display " + styles.snacksTitle}><Popcorn className="size-5 text-primary" aria-hidden="true" /> AstraSnack para sua sessão</h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha produtos da unidade do ingresso e pague tudo no mesmo pedido.</p>
    </header>
    <div className={styles.snacksBody}>
      {ticketItems.some(item => item.quoted && item.discountSources?.includes('TUESDAY_PROMOTION')) &&
        <p className="mt-2 text-sm font-semibold text-primary">Terça de Cinema aplicada aos ingressos elegíveis. Os valores acima já incluem o desconto.</p>}
      {tickets.length > 1 && <label className="mt-3 grid gap-1 text-sm">
        Sessão dos combos temáticos
        <select className="min-w-0 rounded-md border border-border bg-background px-3 py-2" value={selectedSession} disabled={Boolean(pending)} onChange={event=>setSelectedSession(event.target.value)}>
          {tickets.map(ticket=><option key={ticket.sourceId} value={ticket.sourceId}>{ticket.description || ticket.name} · sessão #{ticket.sourceId}</option>)}
        </select>
      </label>}
      <div role="group" aria-label="Filtrar AstraSnack" className={styles.filters}>
        {views.map(({ value, label }) => (
          <Button key={value} type="button" size="sm" variant="outline" aria-pressed={view === value} onClick={() => setView(value)}>
            {label}
          </Button>
        ))}
      </div>
      {view==='suggestions' && loading && <p className="mt-3 text-sm" role="status">Consultando o catálogo da unidade…</p>}
      {view==='suggestions' && failed && <div className="mt-3">
        <p className="text-sm text-destructive" role="alert">Parte do catálogo está indisponível.</p>
        <Button type="button" size="sm" variant="outline" onClick={() => { for(const list of [snacks,combos,themed])if(list.error)list.retry(); }}>Tentar novamente</Button>
      </div>}
      {view==='suggestions' && !loading && !failed && !shown.length && <p className="mt-3 text-sm text-muted-foreground">Nenhum complemento disponível nesta unidade agora.</p>}
      {shown.length > 0 && !session.loading && !session.user && <Link href="/auth/login" className="mt-3 inline-block text-sm font-semibold text-primary underline">Entrar para adicionar</Link>}
      {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
      {notice && <p className="mt-3 text-sm font-semibold text-primary" role="status">{notice}</p>}
      {shown.length > 0 && <ul className={styles.snackList}>
        {shown.map(product => <li className={styles.snackRow} key={product.id}>
          <div className={styles.snackItem}>
            <ProductImage src={product.image} className="size-12 shrink-0 rounded-md" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{product.category}</p>
              <h3 className="wrap-anywhere text-sm font-semibold">{product.name}</h3>
              {product.customerLimit && <p className="text-xs text-muted-foreground">Até {product.customerLimit} por cliente</p>}
            </div>
          </div>
          <div className={styles.snackPrice}><ProductPrice price={product.price} note="Preço de catálogo" /></div>
          {session.user?.role === 'CLIENTE' && <Button type="button" size="sm" variant="outline" disabled={Boolean(pending)} onClick={() => add(product)} aria-label={pending === product.id ? `Consultando ${product.name}` : `Adicionar ${product.name}`}>
            <Plus className="size-4" aria-hidden="true" />{pending === product.id ? 'Consultando…' : 'Adicionar'}
          </Button>}
        </li>)}
      </ul>}
      {page && <ListStatus list={page} empty="Nenhum item disponível nesta categoria." more="Carregar mais itens" />}
    </div>
  </section>;
}
