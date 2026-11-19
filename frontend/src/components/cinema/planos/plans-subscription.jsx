import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { planMoney, planPeriod } from '@/lib/api/plan-subscription.mjs';
import { subscriptionManagementPath } from '@/lib/auth/destination.mjs';
import SubscriptionOffer from './subscription-offer';

export function SubscriptionCheckout({ subscription: s }) {
  if (!s.selectedPlanAvailable) return <p role="status">Este plano está indisponível no período escolhido.</p>;

  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{s.selectedPlanName} · {planPeriod(s.billing)}</p>
    {!s.offer ? <>
      <label className="flex items-center gap-2"><input type="checkbox" checked={s.autoRenew} onChange={event => s.changeAutoRenew(event.target.checked)} disabled={s.pending} /> Renovação automática</label>
      <Button type="button" onClick={s.review} disabled={s.pending}>{s.pending ? 'Consultando…' : 'Revisar oferta'}</Button>
    </> : <>
      <p className="text-lg font-semibold">Valor da oferta {planMoney(s.offer.offer.total)}</p>
      <SubscriptionOffer {...s} actionLabel="Aceitar e registrar assinatura" />
    </>}
  </div>;
}

export default function PlansSubscription(s) {
  const section = useRef(null);
  useEffect(() => {
    if (s.selected) section.current?.scrollIntoView({ block:'start' });
  }, [s.selected]);
  if (!s.selected) return null;
  return <section ref={section} id="assinar" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-12 md:px-10 md:py-16">
    <div className="space-y-5 rounded-2xl border border-primary/20 bg-card p-6 sm:p-8">
      <h2 className="f-display text-3xl font-black">Contratar assinatura</h2>
      {s.error && <p role="alert" className="text-destructive">{s.error}</p>}
      {s.result ? <>
        <p role="status">Assinatura registrada.</p>
        <Link className={buttonVariants()} href={`${subscriptionManagementPath}?cobranca=${s.result.id}`}>Acompanhar pagamento</Link>
      </> : s.session.loading ? <p role="status">Consultando sua conta…</p> :
        s.session.user?.role === 'CLIENTE' ? <SubscriptionCheckout subscription={s} /> :
        s.session.user ? <p>Use uma conta de cliente para contratar.</p> :
        <Link className={buttonVariants()} href="/auth/login">Entrar para assinar</Link>}
    </div>
  </section>;
}
