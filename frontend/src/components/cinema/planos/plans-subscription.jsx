import Link from 'next/link';
import {Button} from '@/components/ui/button';
import ListStatus from '@/components/cinema/home/list-status';
import {planMoney} from '@/lib/api/plan-subscription.mjs';

const statusLabel={PENDENTE:'Pendente de pagamento',ATIVA:'Ativa',CANCELADA:'Cancelada',EXPIRADA:'Expirada',SUSPENSA:'Suspensa'};
export default function PlansSubscription({selectedPlanName,selected,billing,autoRenew,changeAutoRenew,offer,accepted,setAccepted,error,pending,result,review,subscribe,session,mine}){
 return <section id="assinar" className="mx-auto max-w-[1600px] scroll-mt-24 space-y-8 px-5 py-12 md:px-10 md:py-16">
  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
   <p className="text-xs font-bold uppercase tracking-widest text-primary">Sua assinatura</p>
   <h2 className="f-display mt-2 text-3xl font-black">{selectedPlanName||'Escolha seu plano'}</h2>
   <p className="mt-3 text-sm text-muted-foreground">Confira o contrato antes de confirmar. A ativação depende da aprovação do pagamento.</p>
   <p className="mt-2 text-sm text-muted-foreground">Por enquanto, você pode registrar o contrato, mas o pagamento de assinaturas ainda não está disponível nesta página. Uma assinatura pendente impede nova contratação.</p>
   {session.loading?<p role="status" className="mt-4">Verificando sua conta…</p>:!session.user?
    <Button className="mt-5" nativeButton={false} render={<Link href="/auth/login" />}>Entrar para contratar</Button>
    :session.user.role!=='CLIENTE'?<p className="mt-4">Use uma conta de cliente para contratar um plano.</p>
    :selected&&<div className="mt-6 space-y-5">
     <p>Período: <strong>{billing==='monthly'?'Mensal':'Anual'}</strong> · Pagamento pelo titular.</p>
     <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={autoRenew} disabled={pending||Boolean(result)} onChange={e=>changeAutoRenew(e.target.checked)} className="mt-1 accent-primary" /> Ativar renovação automática, conforme as condições do contrato.</label>
     {!result&&<Button variant="outline" disabled={pending} onClick={review}>{pending?'Aguarde…':offer?'Atualizar oferta':'Revisar contrato'}</Button>}
     {offer&&<div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h3 className="text-xl font-bold">Oferta para {offer.offer.lines?.[0]?.plan?.name||selectedPlanName}</h3>
      <p className="text-2xl font-bold text-primary">{planMoney(offer.offer.total)} <span className="text-sm font-normal text-muted-foreground">{billing==='monthly'?'/mês':'/ano'}</span></p>
      <p className="text-sm whitespace-pre-wrap">{offer.offer.conditions}</p>
      <p className="text-sm text-muted-foreground">Taxas: {planMoney(offer.offer.fees)}</p>
      {['business','terms','privacy'].map(key=>{
       const doc=offer[key];if(!doc)return null;
       return <details key={key} className="rounded-lg border border-border p-4">
        <summary className="cursor-pointer font-semibold">{doc.title} · versão {doc.version}</summary>
        {key==='business'?<div className="mt-3 space-y-1 text-sm">
         <p>{doc.body?.legalName} · CNPJ {doc.body?.cnpj}</p><p>{doc.body?.physicalAddress}</p><p>{doc.body?.email}</p>
         {doc.body?.supportChannels?.map(channel=><p key={channel}>{channel}</p>)}
        </div>:<p className="mt-3 whitespace-pre-wrap text-sm leading-6">{doc.body?.text}</p>}
       </details>;
      })}
      {!result&&<>
       <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={pending} className="mt-1 accent-primary" /> Li e aceito a oferta, os termos e a política de privacidade apresentados acima.</label>
       <Button onClick={subscribe} disabled={pending||!accepted}>{pending?'Enviando…':'Confirmar contratação'}</Button>
      </>}
     </div>}
     {error&&<p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">{error}</p>}
     {result&&<div role="status" className="rounded-xl border border-primary/30 bg-card p-5">
      <h3 className="font-bold">Contrato #{result.id} registrado</h3>
      <p className="mt-2">{statusLabel[result.status]||result.status}</p>
      {result.chargeId&&<p className="mt-2 text-sm">Cobrança #{result.chargeId} · {planMoney(result.contractPrice)}</p>}
      <p className="mt-3 text-sm text-muted-foreground">O pagamento de assinaturas ainda não está disponível nesta página. O registro do contrato não confirma o pagamento nem ativa os benefícios.</p>
     </div>}
    </div>}
  </div>
  {mine&&<div className="rounded-2xl border border-border bg-card/70 p-6 sm:p-8">
   <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="f-display text-3xl font-black">Minhas assinaturas</h2><Button variant="outline" onClick={mine.retry} disabled={mine.loading}>Atualizar assinaturas</Button></div>
   <ul className="mt-5 space-y-3">{mine.items.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-border p-4">
    <div><p className="font-semibold">{item.contract?.name||'Plano #'+item.planId}</p><p className="mt-1 text-sm text-muted-foreground">Contrato #{item.id} · {item.period==='ANUAL'?'Anual':'Mensal'} · {item.autoRenew?'Renovação automática':'Sem renovação automática'}</p></div>
    <div><p>{statusLabel[item.status]||item.status}</p><p className="text-sm text-muted-foreground">{planMoney(item.contractPrice)}</p></div>
   </li>)}</ul>
   <ListStatus list={mine} empty="Você ainda não possui assinaturas." />
  </div>}
  <p className="text-sm text-muted-foreground">Pagamento, convites para compartilhar o plano, cancelamento e resgate de benefícios terão fluxos próprios. Nenhum convite é enviado por esta página.</p>
 </section>;
}
