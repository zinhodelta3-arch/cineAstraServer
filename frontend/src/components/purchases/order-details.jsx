import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {QRCodeSVG} from 'qrcode.react';
import useOrderDetails from '@/hooks/cinema/minhascompras/use-order-details';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import ListStatus from '@/components/cinema/home/list-status';
import {orderStatuses,itemTypes,ticketStatuses,purchaseMoney,purchaseDate,validOrderId} from '@/lib/api/purchases.mjs';
const activeOrderStatuses=new Set(['AGENDADO','EM_REALIZACAO','ATRASADO','PARTICIPANDO']);
const orderStyles = `
.cine-order-dialog { --order-surface: color-mix(in srgb, var(--card) 70%, var(--background)); --order-line: color-mix(in srgb, var(--border) 65%, var(--order-surface)); gap: 1rem; background: var(--order-surface); color: var(--card-foreground, var(--foreground)); border-color: var(--order-line); }
.cine-order-header { display: grid; gap: .5rem; padding: .25rem 2.4rem 1rem 0; border-bottom: 1px dashed var(--border); }
.cine-order-brand { display: flex; align-items: center; gap: .55rem; color: var(--primary); font-weight: 800; font-size: .69rem; letter-spacing: .18em; }
.cine-order-title { font-family: var(--theme-font-serif, Georgia, serif); font-size: clamp(1.65rem, 4vw, 2.35rem); font-weight: 700; line-height: 1.13; overflow-wrap: anywhere; }
.cine-order-meta { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; }
.cine-order-pill { border: 1px solid var(--order-line); border-radius: 999px; padding: .25rem .65rem; font-size: .75rem; }
.cine-order-pill--primary { background: var(--primary); color: var(--primary-foreground); border-color: transparent; }
.cine-order-panel { min-width: 0; border: 1px solid var(--order-line); border-radius: var(--radius-xl, 1rem); background: color-mix(in srgb, var(--background) 42%, var(--order-surface)); padding: clamp(.8rem, 3vw, 1.15rem); }
.cine-order-actions { display: flex; flex-wrap: wrap; gap: .6rem; }
.order-ticket-preview { --ticket-width: min(76%, 17.5rem); --ticket-paper: var(--primary); --ticket-ink: var(--primary-foreground); width: 100%; max-width: 30rem; min-width: 0; margin-inline: auto; }
.order-ticket-stack { display: grid; position: relative; isolation: isolate; overflow: hidden; padding-block: 1rem 1.6rem; touch-action: pan-y; }
.order-ticket-stack[data-swipeable="true"] { cursor: grab; user-select: none; }
.order-ticket-stack[data-dragging="true"] { cursor: grabbing; }
.order-ticket-card { grid-area: 1 / 1; position: relative; isolation: isolate; display: grid; align-content: start; justify-items: center; gap: .45rem; width: var(--ticket-width); margin-inline: auto; min-width: 0; padding: 2.9rem clamp(.7rem, 3vw, 1.3rem) 5.9rem; color: var(--ticket-ink); text-align: center; overflow-wrap: anywhere; filter: drop-shadow(0 .45rem .6rem #0004); transform: translateX(calc((var(--ticket-slot) - var(--ticket-step)) * (100% + 1.1rem) + var(--ticket-offset))); }
.order-ticket-card[data-slot="0"] { z-index: 1; }
.order-ticket-card[data-slot]:not([data-slot="0"]) { visibility: hidden; pointer-events: none; }
.order-ticket-stack[data-reveal="1"] [data-slot="1"], .order-ticket-stack[data-reveal="-1"] [data-slot="-1"] { visibility: visible; z-index: 2; }
.order-ticket-stack[data-moving="true"] .order-ticket-card { transition: transform 320ms cubic-bezier(.22,.72,.24,1); }
.order-ticket-shape { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; color: var(--ticket-paper); }
.order-ticket-shadow { position: absolute; top: 1.15rem; bottom: 1.85rem; left: 50%; width: var(--ticket-width); transform: translateX(-43%) rotate(8deg); --ticket-paper: color-mix(in srgb, var(--primary) 68%, var(--background)); pointer-events: none; }
.order-ticket-shadow--far { transform: translateX(-56%) rotate(-7deg); --ticket-paper: color-mix(in srgb, var(--primary) 46%, var(--background)); }
.order-ticket-card::after { content: ""; position: absolute; inset: auto 18% 3.25rem; height: 3px; background: repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 7px); opacity: .35; pointer-events: none; }
.order-ticket-brand { display: flex; align-items: center; justify-content: center; gap: .5rem; font-size: .65rem; font-weight: 800; letter-spacing: .17em; }
.order-ticket-brand::before, .order-ticket-brand::after { content: ""; height: 1px; width: 1rem; background: currentColor; opacity: .45; }
.order-ticket-title { font: 700 1.3rem/1.1 var(--theme-font-serif, Georgia, serif); }
.order-ticket-id { font-size: .72rem; font-variant-numeric: tabular-nums; }
.order-ticket-code { display: grid; place-items: center; width: fit-content; max-width: 100%; margin: .15rem auto; border-radius: .65rem; background: #fff; box-shadow: 0 .2rem .5rem #0002; overflow: hidden; }
.order-ticket-code svg { display: block; max-width: 100%; height: auto; }
.order-ticket-details { font-size: .72rem; }
.order-ticket-summary { display: grid; justify-items: center; gap: .15rem; width: 100%; margin-top: .25rem; padding-top: .55rem; border-top: 1px dashed color-mix(in srgb, var(--ticket-ink) 50%, transparent); font-size: .73rem; }
.order-ticket-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .5rem .75rem; }
@media (prefers-reduced-motion: reduce) { .order-ticket-stack[data-moving="true"] .order-ticket-card { transition: none; } }
`;

function TicketShape() {
 return <svg className="order-ticket-shape" viewBox="0 0 280 410" preserveAspectRatio="none" aria-hidden="true">
  <path fill="currentColor" fillRule="evenodd" d="M24 0H91Q96 0 97 7A44 44 0 0 0 183 7Q184 0 189 0H256Q280 0 280 24V336H267A8 8 0 0 0 267 352H280V386Q280 410 256 410H189Q184 410 183 403A44 44 0 0 0 97 403Q96 410 91 410H24Q0 410 0 386V352H13A8 8 0 0 0 13 336H0V24Q0 0 24 0Z M63 336h20a8 8 0 0 1 0 16H63a8 8 0 0 1 0-16Z M130 336h20a8 8 0 0 1 0 16h-20a8 8 0 0 1 0-16Z M197 336h20a8 8 0 0 1 0 16h-20a8 8 0 0 1 0-16Z"/>
 </svg>;
}

function OrderTicketPreview({order,detail,tickets}) {
 const [index,setIndex]=useState(0);
 const [drag,setDrag]=useState(null);
 const [slide,setSlide]=useState(null);
 const pointer=useRef(null);
 const count=Math.max(1,tickets.length);
 const position=Math.min(index,count-1);
 const swipeable=count>1;
 const offset=drag??0;
 const reveal=slide?.direction??Math.sign(-offset);

 useEffect(()=>{
  if(!slide)return;
  const timer=setTimeout(()=>{setIndex(slide.target);setSlide(null);},360);
  return ()=>clearTimeout(timer);
 },[slide]);

 function finishSlide() {
  if(!slide)return;
  setIndex(slide.target);
  setSlide(null);
 }

 function move(step,reboundDirection=step) {
  const target=(position+step+count)%count;
  setDrag(null);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.caMotion==='reduce'){
   setIndex(target);
   return;
  }
  setSlide({step,target,direction:reboundDirection});
 }

 function startDrag(event) {
  if(!swipeable||slide||!event.isPrimary||event.button!==0)return;
  pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY,time:event.timeStamp};
  event.currentTarget.setPointerCapture(event.pointerId);
  setDrag(0);
 }

 function updateDrag(event) {
  if(pointer.current?.id!==event.pointerId)return;
  const limit=event.currentTarget.clientWidth*.7;
  setDrag(Math.max(-limit,Math.min(limit,event.clientX-pointer.current.x)));
 }

 function cancelDrag(event) {
  if(pointer.current?.id!==event.pointerId)return;
  pointer.current=null;
  if(offset)move(0,Math.sign(-offset));
  else setDrag(null);
 }

 function finishDrag(event) {
  const start=pointer.current;
  if(start?.id!==event.pointerId)return;
  pointer.current=null;
  const x=event.clientX-start.x;
  const y=event.clientY-start.y;
  const distance=Math.abs(x);
  const threshold=Math.min(72,event.currentTarget.clientWidth*.18);
  const flick=distance>=24&&distance/Math.max(1,event.timeStamp-start.time)>.5;
  if(distance>Math.abs(y)&&(distance>=threshold||flick)){
   move(Math.sign(-x));
  }else if(offset){
   move(0,Math.sign(-offset));
  }else{
   setDrag(null);
  }
 }

 return <section className="order-ticket-preview" aria-label="QR Code do pedido">
  <div className="order-ticket-stack" data-swipeable={swipeable} data-dragging={drag!==null} data-moving={slide!==null} data-reveal={reveal}
   style={{'--ticket-offset':offset+'px','--ticket-step':slide?.step??0}}
   onPointerDown={startDrag} onPointerMove={updateDrag} onPointerUp={finishDrag}
   onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}>
   {count>2&&<div className="order-ticket-shadow order-ticket-shadow--far" aria-hidden="true"><TicketShape /></div>}
   {swipeable&&<div className="order-ticket-shadow" aria-hidden="true"><TicketShape /></div>}
   {(swipeable?[-1,0,1]:[0]).map(slot=>{
    const ticket=tickets[(position+slot+count)%count];
    return <article key={slot} className="order-ticket-card" data-slot={slot} aria-hidden={slot!==0} style={{'--ticket-slot':slot}}
     onTransitionEnd={slot===0?event=>{if(event.target===event.currentTarget&&event.propertyName==='transform')finishSlide();}:undefined}>
     <TicketShape />
     <span className="order-ticket-brand"><span aria-hidden="true">✦</span> CineAstra</span>
     <h3 className="order-ticket-title">{ticket?(itemTypes[ticket.type]||ticket.type):'QR Code do pedido'}</h3>
     <p className="order-ticket-id">Pedido #{detail.orderId}</p>
     <div className="order-ticket-code">
      <QRCodeSVG value={detail.orderId} size={160} marginSize={4} fgColor="#000" bgColor="#fff" title={`QR Code do pedido #${detail.orderId}`} />
     </div>
     {ticket&&<p className="order-ticket-details">Item #{ticket.id} · {ticketStatuses[ticket.status]||ticket.status}</p>}
     <div className="order-ticket-summary">
      <p>{purchaseDate(order.createdAt)} (Brasília)</p>
      <p>Total do pedido <strong>{purchaseMoney(order.total)}</strong></p>
     </div>
    </article>;
   })}
  </div>
  {swipeable&&<div className="order-ticket-controls">
   <Button variant="outline" size="sm" aria-disabled={Boolean(slide)} onClick={()=>{if(!slide&&drag===null)move(-1);}}>‹ Anterior</Button>
   <span className="text-xs text-muted-foreground" aria-live="polite">Ingresso {position+1} de {count}</span>
   <Button variant="outline" size="sm" aria-disabled={Boolean(slide)} onClick={()=>{if(!slide&&drag===null)move(1);}}>Próximo ›</Button>
  </div>}
 </section>;
}

function ResourceState({resource}){
 return <>{resource.loading&&<p role="status" className="mt-4">Carregando…</p>}{resource.error&&<div role="alert" className="my-4"><p>{resource.error}</p><Button variant="outline" className="mt-3" onClick={resource.retry}>Tentar novamente</Button></div>}</>;
}
export default function OrderDetails({order,onClose,onChanged}){
 const s=useOrderDetails(order,onChanged),data=s.detail.data,receipt=s.receipt.data;
 const showOrderQr=Boolean(
  data&&!s.detail.loading&&!s.detail.error&&
  ['PAGO','FINALIZADO'].includes(data.financialStatus)&&
  activeOrderStatuses.has(data.operationalStatus)&&validOrderId(data.orderId)
 );
 return <Dialog open onOpenChange={open=>{if(!open&&!s.pending)onClose();}}><DialogContent className="cine-order-dialog max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
  <style>{orderStyles}</style>
  <DialogHeader>
   <div className="cine-order-header">
    <p className="cine-order-brand text-primary"><span aria-hidden="true">✦</span> CINEASTRA</p>
    <DialogTitle className="cine-order-title">Pedido #{order.orderId}</DialogTitle>
    <DialogDescription>{purchaseDate(order.createdAt)} (Brasília) · Total do pedido: {purchaseMoney(order.total)}</DialogDescription>
   </div>
  </DialogHeader>
  {s.notice&&<p role="status" className="rounded-lg border border-primary/30 p-3 text-sm">{s.notice}</p>}
  {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
  <ResourceState resource={s.detail} />
  {data&&<>
   <div className="cine-order-meta" aria-label="Estado do pedido">
    <span className="cine-order-pill cine-order-pill--primary">{orderStatuses[data.financialStatus]||data.financialStatus}</span>
    {data.operationalStatus&&<span className="cine-order-pill">Operação: {data.operationalStatus.replaceAll('_',' ').toLowerCase()}</span>}
   </div>
   {showOrderQr&&<OrderTicketPreview order={order} detail={data} tickets={s.tickets.items} />}
   <div className="cine-order-actions"><Button variant="outline" onClick={s.refresh} disabled={s.pending||s.detail.loading}>Atualizar pedido</Button><Button variant="outline" onClick={s.download} disabled={s.pending||s.detail.loading}>Baixar resumo</Button></div>
   {data.items?.length>0&&<section className="cine-order-panel"><h3 className="mb-3 text-lg font-bold">Andamento dos itens</h3><ul className="space-y-2">{data.items.map((item,index)=><li key={item.itemId+':'+index} className="rounded-lg border border-border p-3 text-sm">{itemTypes[item.type]||item.type} · item #{item.itemId}{item.status?' · '+item.status.replaceAll('_',' ').toLowerCase():''}</li>)}</ul></section>}
   {data.financialStatus==='AGUARDANDO_PAGAMENTO'&&!s.confirm&&<Button variant="outline" disabled={s.pending} onClick={()=>s.setConfirm(true)}>Cancelar pedido pendente</Button>}
   {s.confirm&&<section className="rounded-xl border border-destructive/30 p-4" aria-label="Confirmar cancelamento"><h3 className="font-bold">Cancelar este pedido?</h3><p className="my-3 text-sm">As reservas serão liberadas se o backend permitir o cancelamento. Isso não solicita reembolso de um pagamento.</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={s.pending} onClick={()=>s.setConfirm(false)}>Manter pedido</Button><Button disabled={s.pending} onClick={s.cancel}>Confirmar cancelamento</Button></div></section>}
  </>}
  <section className="cine-order-panel"><h3 className="text-lg font-bold">Ingressos e códigos de retirada</h3><p className="my-3 text-xs text-muted-foreground">Os códigos pertencem à sua compra. A validação de uso ocorre no atendimento; não compartilhe publicamente.</p>
   <ul className="space-y-3">{s.tickets.items.map(ticket=><li key={ticket.id} className="rounded-xl border border-border p-4">
    <p className="font-semibold">{itemTypes[ticket.type]||ticket.type} #{ticket.id}</p><p className="mt-1 text-sm">{ticketStatuses[ticket.status]||ticket.status}</p>
    {ticket.expiresAt&&<p className="mt-1 text-xs">Validade: {purchaseDate(ticket.expiresAt)} (Brasília)</p>}
    {ticket.code&&<div className="mt-3"><code className="block select-all break-all text-sm">{ticket.code}</code><Button variant="outline" size="sm" className="mt-2" onClick={()=>s.copy(ticket.code)}>Copiar código #{ticket.id}</Button></div>}
   </li>)}</ul>
   <ListStatus list={s.tickets} empty="Nenhum ingresso ou código emitido para este pedido." more="Carregar mais ingressos" />
  </section>
  <section className="cine-order-panel"><h3 className="text-lg font-bold">Contrato da compra</h3><p className="my-3 text-xs text-muted-foreground">O contrato registra a oferta aceita. Ele e o resumo baixado não são nota fiscal nem comprovante de estorno.</p>
   {!s.showReceipt?<Button variant="outline" onClick={()=>s.setShowReceipt(true)}>Consultar contrato</Button>:<ResourceState resource={s.receipt} />}
   {receipt&&<div className="mt-4 space-y-4">
    <p className="text-sm">Aceito em {purchaseDate(receipt.acceptedAt)} (Brasília)</p>
    <ul className="space-y-2">{receipt.contract.offer.lines.map((line,index)=><li key={index} className="rounded-lg border border-border p-3 text-sm">{itemTypes[line.category]||line.category} #{line.id} · {line.quantity} × {purchaseMoney(line.unitPrice)} · Subtotal {purchaseMoney(line.subtotal)}</li>)}</ul>
    <p>Total contratado: <strong>{purchaseMoney(receipt.contract.offer.total)}</strong></p>
    <p className="text-sm">Taxas: {purchaseMoney(receipt.contract.offer.fees)}</p>
    <p className="whitespace-pre-wrap text-sm">{receipt.contract.offer.conditions}</p>
    {['terms','privacy'].map(key=>receipt.contract[key]&&<details key={key} className="rounded-lg border border-border p-3"><summary className="cursor-pointer font-semibold">{receipt.contract[key].title} · versão {receipt.contract[key].version}</summary><p className="mt-3 whitespace-pre-wrap break-words text-sm">{receipt.contract[key].body?.text}</p></details>)}
   </div>}
  </section>
  <p className="text-sm text-muted-foreground">Solicitação e acompanhamento de reembolso ainda não estão disponíveis nesta página. <Link href="/cinema/suporte" className="text-primary underline">Fale com o suporte</Link> e informe o número do pedido.</p>
 </DialogContent></Dialog>;
}
