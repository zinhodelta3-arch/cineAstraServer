import { Button } from '@/components/ui/button';

export default function SubscriptionOffer({ offer, accepted, setAccepted, pending, subscribe, actionLabel }) {
  return <div className="space-y-4">
    {offer.offer.conditions && <p className="text-sm text-muted-foreground">{offer.offer.conditions}</p>}
    {[['Termos da assinatura', offer.terms], ['Privacidade', offer.privacy]].map(([title, document]) =>
      <details key={title} className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer font-medium">{title}</summary>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm">{document.body.text}</p>
      </details>
    )}
    <label className="flex items-start gap-2 text-sm">
      <input className="mt-1" type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={pending} />
      Li e aceito a oferta, os termos e a política de privacidade.
    </label>
    <Button type="button" onClick={subscribe} disabled={!accepted || pending}>{pending ? 'Registrando…' : actionLabel}</Button>
  </div>;
}
