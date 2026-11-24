"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Ticket } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import useCinemaPlans from '@/hooks/cinema/planos/use-cinema-plans';
import { subscriptionManagementPath } from '@/lib/auth/destination.mjs';
import { readSessionResponse, sessionFetch } from '@/lib/auth/session-response.mjs';
import { planBenefits, planDate, planModalities, planModality, planMoney, planPeriod, planStatus } from '@/lib/api/plan-subscription.mjs';
import SubscriptionOffer from './subscription-offer';
import SubscriptionPayment from './subscription-payment';
import { SubscriptionCheckout } from './plans-subscription';
import { SubscriptionInvitations, SubscriptionParticipants } from './subscription-sharing';
import ticket from '../ticket.module.css';
import '../perfil/cinema-profile.css';

const planName = (item, names) => item.planName ?? names[item.planId] ?? `Plano #${item.planId}`;

function ChangePlan({ subscription: s, catalog }) {
  const { change, changeResult, offer } = s;
  const stage = changeResult ? 2 : offer ? 1 : 0;
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [stage]);
  const samePlan = change?.planId === s.selected && planPeriod(change?.period) === planPeriod(s.billing) &&
    change?.modality === s.modality && change?.autoRenew === s.autoRenew;

  return <section className={`${ticket.ticket} space-y-5 p-5 sm:p-7`} aria-labelledby="change-plan-heading">
    <ol aria-label="Etapas da troca" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {['Escolher', 'Revisar', 'Confirmar'].map((label, index) => <li key={label} aria-current={stage === index ? 'step' : undefined}
        className={stage === index ? 'font-bold text-primary' : 'text-muted-foreground'}>{label}</li>)}
    </ol>
    <h2 ref={heading} tabIndex={-1} id="change-plan-heading" className={`${ticket.title} text-3xl font-black`}>
      {changeResult ? 'Troca agendada' : offer ? 'Revise a troca' : 'Escolha seu plano'}
    </h2>
    {s.error && <p role="alert" className="text-destructive">{s.error}</p>}
    {changeResult ? <>
      <p role="status">O plano {changeResult.planName} foi agendado para o ciclo de {planDate(changeResult.effectiveOn)}. Ele entra em vigor após o pagamento desse ciclo.</p>
      <Button type="button" onClick={s.resetChange}>Voltar à assinatura</Button>
    </> : offer ? <>
      <dl className="ca-subscription-facts">
        <div><dt>Plano atual</dt><dd>{planName(change, s.planNames)} · {planPeriod(change.period)} · {planMoney(change.contractPrice)}</dd></div>
        <div><dt>Novo plano</dt><dd>{s.selectedPlanName} · {planModality(s.modality)} · {planPeriod(s.billing)} · {planMoney(offer.offer.total)}</dd></div>
        <div><dt>Próximo ciclo</dt><dd>{planDate(change.endsOn, true)} · após o pagamento</dd></div>
        <div><dt>Cobrança pela troca hoje</dt><dd>{planMoney(0)}</dd></div>
      </dl>
      <Button type="button" variant="outline" onClick={s.editChoice} disabled={s.pending}>Voltar à escolha</Button>
      <SubscriptionOffer {...s} actionLabel="Confirmar troca de plano" />
    </> : <>
      <p className="text-sm text-muted-foreground">Seu plano atual vale até {planDate(change.endsOn)}. A troca será agendada para o próximo ciclo.</p>
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold">Modalidade
        <select value={s.modality} onChange={event => catalog.setModality(event.target.value)} disabled={s.pending} className="min-h-10 rounded-lg border border-border bg-card px-3">
          {planModalities.map(option => <option key={option.id} value={option.id}>{option.name} · {option.members} {option.members === 1 ? 'pessoa' : 'pessoas'}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">Período
        <select value={s.billing} onChange={event => catalog.setBilling(event.target.value)} disabled={s.pending} className="min-h-10 rounded-lg border border-border bg-card px-3">
          <option value="monthly">Mensal</option><option value="annual">Anual</option>
        </select>
      </label>
      </div>
      {catalog.list.loading && <p role="status">Carregando planos…</p>}
      {catalog.list.error && <div role="alert"><p>{catalog.list.error}</p><Button type="button" variant="outline" onClick={catalog.list.retry}>Tentar novamente</Button></div>}
      {!catalog.list.loading && !catalog.list.error && !catalog.plans.length && <p>Nenhum plano está disponível para troca no momento.</p>}
      {catalog.plans.length > 0 && <fieldset disabled={s.pending}>
        <legend className="mb-2 text-sm font-bold">Planos</legend>
        {catalog.plans.map(plan => <label key={plan.id} className="ca-plan-option">
          <input type="radio" name="next-plan" value={plan.id} checked={plan.id === s.selected} disabled={!plan.available} onChange={() => catalog.startSubscription(plan.id)} />
          <span><strong>{plan.name}</strong>{plan.id === change.planId && <small className="block text-muted-foreground">Categoria atual</small>}</span>
          <span className="font-bold">{plan.priceLabel}{plan.available && catalog.periodFor}</span>
        </label>)}
      </fieldset>}
      {catalog.list.cursor && <Button type="button" variant="outline" onClick={catalog.list.loadMore} disabled={catalog.list.loading}>Mais planos</Button>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.autoRenew} onChange={event => s.changeAutoRenew(event.target.checked)} disabled={s.pending} /> Renovação automática</label>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={s.review} disabled={s.pending || samePlan || !s.selectedPlanAvailable}>{s.pending ? 'Consultando…' : 'Revisar troca'} <ArrowRight size={16} aria-hidden="true" /></Button>
        <Button type="button" variant="outline" onClick={s.resetChange} disabled={s.pending}>Voltar à assinatura</Button>
      </div>
    </>}
  </section>;
}

function SubscriptionList({ subscription: s, initialPaymentId }) {
  const [cancelId, setCancelId] = useState(null);
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const draft = s.mine.items.find(item => item.administrativeDraft);
  const subscriptions = s.mine.items.filter(item => !item.administrativeDraft);
  const currentPayment = paymentId === undefined ? s.result?.id : paymentId;
  const paymentHeading = useRef(null);
  useEffect(() => { if (currentPayment) paymentHeading.current?.focus(); }, [currentPayment]);
  const today = new Date().toISOString().slice(0, 10);

  return <div className="space-y-6">
    {s.mine.loading && <p role="status">Carregando assinaturas…</p>}
    {s.mine.error && <div role="alert" className="space-y-2"><p>{s.mine.error}</p><Button type="button" variant="outline" onClick={subscriptions.length || draft ? s.mine.loadMore : s.mine.retry}>Tentar novamente</Button></div>}
    {!s.mine.loading && !s.mine.error && !subscriptions.length && !draft && <section className={`${ticket.ticket} space-y-3 p-5 sm:p-7`}>
      <h2 className={`${ticket.title} text-2xl font-bold`}>Você ainda não tem assinaturas</h2>
      <Link className={buttonVariants()} href="/cinema/planos#planos">Comparar planos</Link>
    </section>}
    {s.cancelNotice && <p role="status" className="rounded-lg border border-border p-3">{s.cancelNotice}</p>}
    {s.error && !cancelId && <p role="alert" className="text-destructive">{s.error}</p>}
    {draft && !s.result && <section className={`${ticket.ticket} space-y-3 p-5 sm:p-7`}>
      <h2 className={`${ticket.title} text-2xl font-bold`}>Proposta pendente de aceite</h2>
      <p>{planName(draft, s.planNames)} · {planModality(draft.modality) ?? 'Individual'} · {planPeriod(draft.period)}</p>
      {s.selected ? <SubscriptionCheckout subscription={s} /> :
        <Button type="button" onClick={() => s.chooseDraft(draft)} disabled={s.pending}>Selecionar proposta</Button>}
    </section>}
    {subscriptions.map(item => {
      const active = item.status === 'ATIVA';
      const scheduled = item.scheduledChange;
      const benefits = item.contract ? planBenefits(item.contract) : [];
      return <section key={item.id} className={`${ticket.ticket} overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-7">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{active ? 'Plano atual' : 'Assinatura'}</p>
            <h2 className={`${ticket.title} text-3xl font-black`}>{planName(item, s.planNames)}</h2>
            <p>{[planModality(item.modality), planPeriod(item.period), planMoney(item.contractPrice)].filter(Boolean).join(' · ')} <span className="block text-sm font-bold text-primary sm:inline sm:ms-2">{planStatus(item)}</span></p>
            {item.endsOn && <p className="text-sm text-muted-foreground">Ciclo até {planDate(item.endsOn)}</p>}
          </div>
          {active && !item.endingOn && item.endsOn >= today && <Button type="button" onClick={() => s.startChange(item)} disabled={s.pending}>Trocar plano</Button>}
          {item.endingOn && <p className="w-full rounded-lg border border-dashed border-border p-3 text-sm">
            {active ? `Encerramento programado. Seu acesso vai até ${planDate(item.endingOn)}.` : `Assinatura encerrada ao fim do ciclo de ${planDate(item.endingOn)}.`}
          </p>}
          {active && item.adminProposal && !item.endingOn && <div className="w-full space-y-2 rounded-lg border border-dashed border-border p-3 text-sm">
            <p><strong>Proposta da administração</strong><br />{item.adminProposal.planName} · {planModality(item.adminProposal.modality)} · {planPeriod(item.adminProposal.period)}</p>
            <Button type="button" variant="outline" onClick={() => s.startChange(item, item.adminProposal)} disabled={s.pending}>Revisar proposta</Button>
          </div>}
          {scheduled && <p className="w-full rounded-lg border border-dashed border-border p-3 text-sm">
            <strong>Troca agendada</strong><br />{[scheduled.planName, planModality(scheduled.modality), planPeriod(scheduled.period), planMoney(scheduled.price)].filter(Boolean).join(' · ')} · a partir de {planDate(scheduled.effectiveOn)}, após o pagamento.
          </p>}
          {active && benefits.length > 0 && <details className="w-full text-sm">
            <summary className="cursor-pointer font-semibold">Benefícios deste ciclo</summary>
            <ul className="mt-2 list-inside list-disc space-y-1">{benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
            {item.contract?.freeComboId && Number(item.contract.freeCombosPerMonth) > 0 && <MonthlyCombo subscriptionId={item.id} />}
          </details>}
        </div>
        <div aria-hidden="true" className={ticket.tear} />
        <div className={`${ticket.stub} flex flex-wrap gap-3 p-4 sm:px-7`}>
          <Button type="button" variant="outline" onClick={() => setPaymentId(item.id)} disabled={s.pending || currentPayment === item.id}>Ver cobrança</Button>
          {['ATIVA', 'PENDENTE'].includes(item.status) && <Button type="button" variant="ghost" onClick={() => setCancelId(item.id)} disabled={s.pending}>Cancelar assinatura</Button>}
        </div>
        {active && item.maxMembers > 1 && <SubscriptionParticipants item={item} userId={s.session.user.id} />}
      </section>;
    })}
    {s.mine.cursor && !s.mine.error && <Button type="button" variant="outline" onClick={s.mine.loadMore} disabled={s.mine.loading}>Carregar mais assinaturas</Button>}
    <SubscriptionInvitations userId={s.session.user.id} onPayment={setPaymentId} />
    {currentPayment && <section className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2"><h2 ref={paymentHeading} tabIndex={-1} className={`${ticket.title} text-2xl font-bold`}>Cobrança</h2><Button type="button" variant="ghost" onClick={() => setPaymentId(null)}>Fechar cobrança</Button></div>
      <SubscriptionPayment key={currentPayment} id={currentPayment} onUpdated={s.mine.retry} />
    </section>}
    <Dialog open={Boolean(cancelId)} onOpenChange={open => { if (!open && !s.pending) setCancelId(null); }}>
      <DialogContent>
        <DialogTitle>Cancelar assinatura</DialogTitle>
        <DialogDescription>O cancelamento encerra a renovação. A elegibilidade para reembolso segue as condições da contratação.</DialogDescription>
        {s.error && <p role="alert" className="text-destructive">{s.error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={s.pending} onClick={() => setCancelId(null)}>Voltar</Button>
          <Button type="button" variant="destructive" disabled={s.pending} onClick={async () => { if (await s.cancel(cancelId)) setCancelId(null); }}>{s.pending ? 'Cancelando…' : 'Confirmar cancelamento'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}

function MonthlyCombo({ subscriptionId }) {
  const lock = useRef(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  async function requestCombo() {
    if (lock.current) return;
    lock.current = true;
    setStatus('pending');
    setError('');
    try {
      await readSessionResponse(await sessionFetch('/api/plans/redeem-combo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      }));
      setStatus('requested');
    } catch (cause) {
      setError(cause.message);
      setStatus('idle');
    } finally { lock.current = false; }
  }
  return <div className="mt-3 space-y-2">
    {status === 'requested' ? <p role="status">Solicitação de combo registrada.</p> :
      <Button type="button" size="sm" variant="outline" onClick={requestCombo} disabled={status === 'pending'}>Solicitar combo mensal</Button>}
    {error && <p className="text-destructive" role="alert">{error}</p>}
  </div>;
}

export default function ManageSubscription({ initialPaymentId }) {
  const { catalog, subscription:s } = useCinemaPlans({ management:true });
  return <main className="ca-profile mx-auto min-h-screen max-w-[1040px] px-5 pt-8 pb-12 sm:px-8 lg:px-12">
    <Link href="/cinema/perfil" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} aria-hidden="true" />Minha conta</Link>
    <div className="mb-5 flex items-center gap-3">
      <Ticket size={28} className="shrink-0 text-primary" aria-hidden="true" />
      <h1 className="ca-display break-words text-4xl font-black uppercase sm:text-6xl">Gerenciar assinatura</h1>
    </div>
    <div className="ca-perf mb-7" aria-hidden="true" />
    {s.session.loading ? <p role="status">Verificando sua conta…</p> : s.mine ? (
      s.change || s.changeResult ? <ChangePlan subscription={s} catalog={catalog} /> :
        <SubscriptionList key={s.session.user.id} subscription={s} initialPaymentId={initialPaymentId} />
    ) : s.session.user ? <p>Use uma conta de cliente para gerenciar uma assinatura.</p> :
      <Link className={buttonVariants()} href={`/auth/login?next=${encodeURIComponent(subscriptionManagementPath)}`}>Entrar para gerenciar assinatura</Link>}
  </main>;
}
