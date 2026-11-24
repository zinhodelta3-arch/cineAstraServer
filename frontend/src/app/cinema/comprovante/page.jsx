import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, TicketCheck } from 'lucide-react';
import { backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { purchaseVerificationHref, validPurchaseReference } from '@/lib/api/purchase-reference.mjs';
import { itemTypes, orderStatuses, purchaseDate, purchaseMoney, purchaseDocumentTotalLabel, purchaseItemLabel, purchasePaymentMethods, purchasePaymentStatuses, purchaseSessionDate, ticketStatuses } from '@/lib/api/purchases.mjs';

export const metadata = { title: 'Verificar comprovante | CineAstra', referrer: 'no-referrer', robots: { index: false, follow: false } };

export default async function VerifyPurchase({ searchParams }) {
  const { referencia } = await searchParams;
  const reference = typeof referencia === 'string' ? referencia.trim().toUpperCase().slice(0, 54) : '';
  let purchase = null;
  let error = '';
  if (validPurchaseReference(reference)) {
    const user = await currentUser();
    if (!user) redirect('/auth/login?next=' + encodeURIComponent(purchaseVerificationHref(reference)));
    if (user.role !== 'CLIENTE') error = 'Entre com a conta de cliente que fez a compra.';
    else {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      try {
        purchase = await backendAuth('/orders/verification?reference=' + encodeURIComponent(reference), { token });
      } catch (cause) {
        error = cause.status === 404 ? 'Comprovante indisponível para esta conta.' : 'Não foi possível consultar a compra. Tente novamente.';
      }
    }
  } else if (reference) error = 'Confira a referência que aparece no canhoto do comprovante.';

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/cinema/minhascompras" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded text-sm font-semibold text-primary hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Minhas compras
      </Link>
      <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="receipt-title">
        <header className="border-b border-dashed border-border bg-secondary px-5 py-6 text-secondary-foreground sm:px-7">
          <h1 id="receipt-title" className="f-display text-3xl font-bold sm:text-4xl">Verificar comprovante</h1>
        </header>
        <div className="px-5 py-6 sm:px-7">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 basis-[16rem] text-sm font-semibold">
              Referência da compra
              <input name="referencia" defaultValue={reference} required maxLength={54} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                aria-invalid={Boolean(error)} aria-describedby={error ? 'receipt-error' : undefined}
                className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
            </label>
            <button className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" type="submit">Verificar compra</button>
          </form>
          {error && <p role="alert" id="receipt-error" className="mt-4 text-sm text-destructive">{error}</p>}
          {purchase && <PurchaseResult purchase={purchase} />}
        </div>
      </section>
    </main>
  );
}

function PurchaseResult({ purchase }) {
  const items = new Map(purchase.items.map(item => [item.id, item]));
  const method = purchasePaymentMethods[purchase.payment?.type];
  return (
    <div className="mt-7 border-t border-dashed border-border pt-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><TicketCheck className="size-5 text-primary" aria-hidden="true" /> Pedido #{purchase.orderId}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Situação do pedido</dt><dd className="font-semibold">{orderStatuses[purchase.status]}</dd></div>
        <div><dt className="text-muted-foreground">{purchaseDocumentTotalLabel(purchase)}</dt><dd className="font-semibold">{purchaseMoney(purchase.total)}</dd></div>
        <div><dt className="text-muted-foreground">Consulta em Brasília</dt><dd>{purchaseDate(purchase.verifiedAt)}</dd></div>
        {purchase.payment && <div><dt className="text-muted-foreground">Pagamento</dt><dd>{purchasePaymentStatuses[purchase.payment.status]}{method && ` · ${method}${purchase.payment.simulated ? ' simulado' : ''}`}</dd></div>}
      </dl>
      <h3 className="mt-6 font-bold">Itens da compra</h3>
      {purchase.items.length ? <ul className="mt-2 divide-y divide-border">
        {purchase.items.map(item => <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="break-words font-medium">{item.quantity} × {purchaseItemLabel(item)}</p>
            {item.session && <p className="break-words text-xs text-muted-foreground">{[item.name, purchaseSessionDate(item.session), item.session.cinema, item.session.room, item.seat && 'Assento ' + item.seat, item.session.status === 'CANCELADA' && 'Sessão cancelada'].filter(Boolean).join(' · ')}</p>}
            {!item.session && item.venue && <p className="text-xs text-muted-foreground">Retirada em {item.venue}</p>}
          </div>
          <strong className="shrink-0 tabular-nums">{purchaseMoney(item.subtotal)}</strong>
        </li>)}
      </ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhum item registrado.</p>}
      <h3 className="mt-6 font-bold">Ingressos e retiradas</h3>
      {purchase.tickets.length ? <ul className="mt-2 divide-y divide-border">
        {purchase.tickets.map(ticket => <li key={ticket.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
          <p>{itemTypes[ticket.type]}{items.get(ticket.itemId)?.seat && ` · ${items.get(ticket.itemId).seat}`}</p>
          <strong>{ticketStatuses[ticket.status]}</strong>
        </li>)}
      </ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhum ingresso ou código emitido para este pedido.</p>}
    </div>
  );
}
