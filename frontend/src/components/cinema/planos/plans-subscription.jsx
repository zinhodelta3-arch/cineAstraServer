import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { planMoney } from '@/lib/api/plan-subscription.mjs';

export default function PlansSubscription({
  selected, selectedPlanName, selectedPlanAvailable, planNames, billing, autoRenew, changeAutoRenew, offer, accepted, setAccepted,
  error, pending, result, review, subscribe, session, mine, chooseDraft, cancel, cancelNotice
}) {
  const [cancelId, setCancelId] = useState(null);
  const draft = mine?.items.find(item => item.administrativeDraft);
  const client = session.user?.role === 'CLIENTE';
  const subscriptions = mine?.items.filter(item => !item.administrativeDraft) ?? [];
  return <section id="assinar" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-12 md:px-10 md:py-16">
    <div className="space-y-5 rounded-2xl border border-primary/20 bg-card p-6 sm:p-8">
      <div>
        <h2 className="f-display text-3xl font-black">Sua assinatura</h2>
        {selected && <p className="mt-1 text-sm text-muted-foreground">{selectedPlanName ?? `Plano #${selected}`} · {billing === 'annual' ? 'Anual' : 'Mensal'}</p>}
      </div>
      {draft && !result && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <p>Proposta pendente de aceite · {planNames[draft.planId] ?? `Plano #${draft.planId}`} · {draft.period === 'ANUAL' ? 'Anual' : 'Mensal'}</p>
        <Button type="button" variant="outline" onClick={() => chooseDraft(draft)} disabled={pending}>Selecionar proposta</Button>
      </div>}
      {mine && <div className="space-y-2 border-y border-dashed border-border py-4">
        <h3 className="font-semibold">Suas assinaturas</h3>
        {mine.loading && <p role="status">Carregando assinaturas…</p>}
        {mine.error && <div role="alert"><p className="text-destructive">{mine.error}</p><Button type="button" variant="outline" onClick={mine.retry}>Tentar novamente</Button></div>}
        {!mine.loading && !mine.error && !subscriptions.length && !draft && <p className="text-sm text-muted-foreground">Você ainda não tem assinaturas.</p>}
        {cancelNotice && <p role="status">{cancelNotice}</p>}
        {subscriptions.length > 0 && <ul className="space-y-2 text-sm">{subscriptions.map(item => <li className="flex flex-wrap items-center justify-between gap-2" key={item.id}>
          <span>{planNames[item.planId] ?? `Plano #${item.planId}`} · {item.period === 'ANUAL' ? 'Anual' : 'Mensal'} · {item.status === 'PENDENTE' ? 'Aguardando pagamento' : item.status.toLocaleLowerCase('pt-BR')}</span>
          {['ATIVA', 'PENDENTE'].includes(item.status) && <Button type="button" variant="outline" disabled={pending} onClick={() => setCancelId(item.id)}>Cancelar assinatura</Button>}
        </li>)}</ul>}
        {mine.cursor && <Button type="button" variant="outline" onClick={mine.loadMore} disabled={mine.loading}>Carregar mais assinaturas</Button>}
      </div>}
      {error && !cancelId && <p role="alert" className="text-destructive">{error}</p>}
      <Dialog open={Boolean(cancelId && client)} onOpenChange={open => { if (!open && !pending) setCancelId(null); }}>
        <DialogContent>
          <DialogTitle>Cancelar assinatura</DialogTitle>
          <DialogDescription>O cancelamento encerra a renovação. A elegibilidade para reembolso segue as condições da contratação.</DialogDescription>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setCancelId(null)}>Voltar</Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={async () => { if (await cancel(cancelId)) setCancelId(null); }}>{pending ? 'Cancelando…' : 'Confirmar cancelamento'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      {result ? <p role="status">Assinatura #{result.id} registrada. A ativação depende da confirmação do pagamento.</p> :
        session.loading ? <p role="status">Consultando sua conta…</p> :
        !client ? (session.user ? <p>Use uma conta de cliente para contratar.</p> : <Button nativeButton={false} render={<Link href="/auth/login" />}>Entrar para assinar</Button>) :
        !selected ? <Button nativeButton={false} variant="outline" render={<a href="#planos" />}>Comparar planos</Button> :
        !selectedPlanAvailable ? <p role="status">Este plano está indisponível no período escolhido.</p> :
        <div className="space-y-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={autoRenew} onChange={event => changeAutoRenew(event.target.checked)} disabled={pending} /> Renovação automática</label>
          {!offer && <Button type="button" onClick={review} disabled={pending}>{pending ? 'Consultando…' : 'Revisar oferta'}</Button>}
          {offer && <>
            <p className="text-lg font-semibold">Valor da oferta {planMoney(offer.offer.total)}</p>
            <p className="text-sm text-muted-foreground">{offer.offer.conditions}</p>
            {[['Termos da assinatura', offer.terms], ['Privacidade', offer.privacy]].map(([title, document]) =>
              <details key={title} className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer font-medium">{title}</summary>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm">{document.body.text}</p>
              </details>
            )}
            <label className="flex items-start gap-2"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={pending} /> Li e aceito a oferta, os termos e a política de privacidade.</label>
            <Button type="button" onClick={subscribe} disabled={!accepted || pending}>{pending ? 'Registrando…' : 'Aceitar e registrar assinatura'}</Button>
          </>}
        </div>}
    </div>
  </section>;
}
