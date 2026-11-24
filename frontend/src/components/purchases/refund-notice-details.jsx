'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/auth/use-session';
import usePurchaseResource from '@/hooks/cinema/minhascompras/use-purchase-resource';
import { purchaseDate, purchaseMoney } from '@/lib/api/purchases.mjs';
import { Button } from '@/components/ui/button';
import { refundStatusLabels } from './order-refunds';

export default function RefundNoticeDetails({id,orderId}) {
  const {user,loading}=useSession();
  const resource=usePurchaseResource(user?.role==='CLIENTE'?`refunds/${id}`:null,false);
  const refund=resource.data;
  const href=orderId?`/cinema/minhascompras?pedido=${orderId}`:'/cinema/minhascompras';
  return <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
    <Link href={href} prefetch={false} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary underline underline-offset-4">{orderId?'Abrir pedido':'Voltar às compras'}</Link>
    <h1 className="mt-3 mb-6 text-3xl font-bold">Reembolso #{id}</h1>
    <section className="rounded-xl border border-border bg-card p-5">
      {(loading||resource.loading)&&<p role="status">Consultando reembolso…</p>}
      {!loading&&!user&&<Link href="/auth/login" className="text-primary underline">Entre para consultar seu reembolso</Link>}
      {user&&user.role!=='CLIENTE'&&<p role="alert">O reembolso está disponível para a conta que fez a compra.</p>}
      {resource.error&&<div role="alert"><p>{resource.error}</p><Button type="button" variant="outline" className="mt-3" onClick={resource.retry}>Tentar novamente</Button></div>}
      {refund&&<dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Situação</dt><dd className="font-semibold">{refundStatusLabels[refund.status]??refund.status}</dd></div>
        <div><dt className="text-muted-foreground">Solicitado em</dt><dd>{purchaseDate(refund.receivedAt)}</dd></div>
        {refund.requestedAmount!=null&&<div><dt className="text-muted-foreground">Valor solicitado</dt><dd>{purchaseMoney(refund.requestedAmount)}</dd></div>}
        {refund.confirmedAmount!=null&&<div><dt className="text-muted-foreground">Valor confirmado</dt><dd>{purchaseMoney(refund.confirmedAmount)}</dd></div>}
        {refund.respondedAt&&<div><dt className="text-muted-foreground">Respondido em</dt><dd>{purchaseDate(refund.respondedAt)}</dd></div>}
      </dl>}
    </section>
  </main>;
}
