import Link from 'next/link';
import {Button} from '@/components/ui/button';
export default function ExperienceInquiry({catalog:c}){
 const e=c.experience;
 return <section id="reservar" className="scroll-mt-24 border-y border-border bg-card/30"><div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:px-10 lg:grid-cols-2">
  <div><h2 className="f-display text-5xl font-black">Planeje sua experiência</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Escolha uma opção publicada para ver os detalhes e conversar com o suporte. Solicitar informações não confirma disponibilidade, preço final ou reserva.</p>
   {c.detailLoading&&<p role="status" className="mt-6">Carregando detalhes…</p>}{c.detailError&&<div role="alert" className="mt-6"><p>{c.detailError}</p><Button onClick={c.retryDetail}>Tentar novamente</Button></div>}
   {e&&<div className="mt-6"><h3 className="f-title text-2xl font-bold">{e.title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6">{e.description||e.summary}</p><ul className="mt-4 list-inside list-disc space-y-2 text-sm">{e.details.map((item,i)=><li key={i}>{item}</li>)}</ul>{e.targetUrl&&<a href={e.targetUrl} className="mt-5 inline-block font-semibold text-primary underline" {...(e.targetUrl.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{e.ctaLabel||'Saiba mais'}</a>}</div>}
  </div>
  <form onSubmit={c.submitInquiry} className="rounded-2xl border border-border bg-card p-6">
   <h3 className="f-display mb-5 text-3xl font-black">Pedido de informações</h3>
   {c.sent?<div role="status"><p className="font-bold">Solicitação #{c.sent.id} enviada</p><p className="mt-3 text-sm">{c.sent.message}</p><p className="mt-3 text-sm text-muted-foreground">Guarde o número do chamado para consultar com o suporte.</p></div>:<>
    <fieldset disabled={c.pending} className="space-y-4"><label className="block text-sm font-semibold">Experiência desejada<select aria-label="Experiência desejada" required value={c.selectedExperience} onChange={c.changeExperience} className="mt-2 block w-full rounded-lg border border-border bg-background p-3"><option value="">Selecione uma experiência</option>{c.experiences.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Data desejada<input required type="date" min={c.minimumDate} value={c.form.date} onChange={c.update('date')} className="mt-2 block w-full rounded-lg border border-border bg-background p-3"/></label><label className="block text-sm">Pessoas ou veículos<input required type="number" min="1" max="100000" step="1" value={c.form.guests} onChange={c.update('guests')} className="mt-2 block w-full rounded-lg border border-border bg-background p-3"/></label></div>
    <label className="block text-sm">Conte mais sobre seu evento<textarea required minLength={10} maxLength={4000} rows={4} value={c.form.details} onChange={c.update('details')} className="mt-2 block w-full rounded-lg border border-border bg-background p-3"/></label></fieldset>
    {c.message&&<p role="alert" className="mt-4 text-sm">{c.message}</p>}
    {c.session.loading?<p role="status" className="mt-4">Verificando sessão…</p>:!c.session.user?<Link href="/auth/login" className="mt-5 inline-block font-semibold text-primary underline">Entrar para enviar a solicitação</Link>:c.session.user.role!=='CLIENTE'?<p className="mt-4 text-sm">Solicitações devem ser enviadas por uma conta de cliente.</p>:<Button type="submit" disabled={!e||c.pending} className="mt-5 w-full">{c.pending?'Enviando…':'Solicitar informações'}</Button>}
   </>}
  </form>
 </div></section>;
}
