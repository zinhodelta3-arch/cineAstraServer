import Link from 'next/link';
import useOrderDetails from '@/hooks/cinema/minhascompras/use-order-details';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import ListStatus from '@/components/cinema/home/list-status';
import {orderStatuses,itemTypes,ticketStatuses,purchaseMoney,purchaseDate} from '@/lib/api/purchases.mjs';
function ResourceState({resource}){
 return <>{resource.loading&&<p role="status" className="mt-4">Carregando…</p>}{resource.error&&<div role="alert" className="my-4"><p>{resource.error}</p><Button variant="outline" className="mt-3" onClick={resource.retry}>Tentar novamente</Button></div>}</>;
}
export default function OrderDetails({order,onClose,onChanged}){
 const s=useOrderDetails(order,onChanged),data=s.detail.data,receipt=s.receipt.data;
 return <Dialog open onOpenChange={open=>{if(!open&&!s.pending)onClose();}}><DialogContent className="max-h-[90dvh] overflow-y-auto bg-card sm:max-w-3xl">
  <DialogHeader><DialogTitle className="text-3xl font-bold">Pedido #{order.orderId}</DialogTitle><DialogDescription>{purchaseDate(order.createdAt)} (Brasília) · Total do pedido: {purchaseMoney(order.total)}</DialogDescription></DialogHeader>
  {s.notice&&<p role="status" className="rounded-lg border border-primary/30 p-3 text-sm">{s.notice}</p>}
  {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
  <ResourceState resource={s.detail} />
  {data&&<>
   <p className="font-semibold">Estado financeiro: {orderStatuses[data.financialStatus]||data.financialStatus}</p>
   {data.operationalStatus&&<p className="text-sm">Operação: {data.operationalStatus.replaceAll('_',' ').toLowerCase()}</p>}
   <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={s.refresh} disabled={s.pending||s.detail.loading}>Atualizar pedido</Button><Button variant="outline" onClick={s.download} disabled={s.pending||s.detail.loading}>Baixar resumo</Button></div>
   {data.items?.length>0&&<section><h3 className="mb-3 text-lg font-bold">Andamento dos itens</h3><ul className="space-y-2">{data.items.map((item,index)=><li key={item.itemId+':'+index} className="rounded-lg border border-border p-3 text-sm">{itemTypes[item.type]||item.type} · item #{item.itemId}{item.status?' · '+item.status.replaceAll('_',' ').toLowerCase():''}</li>)}</ul></section>}
   {data.financialStatus==='AGUARDANDO_PAGAMENTO'&&!s.confirm&&<Button variant="outline" disabled={s.pending} onClick={()=>s.setConfirm(true)}>Cancelar pedido pendente</Button>}
   {s.confirm&&<section className="rounded-xl border border-destructive/30 p-4" aria-label="Confirmar cancelamento"><h3 className="font-bold">Cancelar este pedido?</h3><p className="my-3 text-sm">As reservas serão liberadas se o backend permitir o cancelamento. Isso não solicita reembolso de um pagamento.</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={s.pending} onClick={()=>s.setConfirm(false)}>Manter pedido</Button><Button disabled={s.pending} onClick={s.cancel}>Confirmar cancelamento</Button></div></section>}
  </>}
  <section className="border-t border-border pt-5"><h3 className="text-lg font-bold">Ingressos e códigos de retirada</h3><p className="my-3 text-xs text-muted-foreground">Os códigos pertencem à sua compra. A validação de uso ocorre no atendimento; não compartilhe publicamente.</p>
   <ul className="space-y-3">{s.tickets.items.map(ticket=><li key={ticket.id} className="rounded-xl border border-border p-4">
    <p className="font-semibold">{itemTypes[ticket.type]||ticket.type} #{ticket.id}</p><p className="mt-1 text-sm">{ticketStatuses[ticket.status]||ticket.status}</p>
    {ticket.expiresAt&&<p className="mt-1 text-xs">Validade: {purchaseDate(ticket.expiresAt)} (Brasília)</p>}
    {ticket.code&&<div className="mt-3"><code className="block select-all break-all text-sm">{ticket.code}</code><Button variant="outline" size="sm" className="mt-2" onClick={()=>s.copy(ticket.code)}>Copiar código #{ticket.id}</Button></div>}
   </li>)}</ul>
   <ListStatus list={s.tickets} empty="Nenhum ingresso ou código emitido para este pedido." more="Carregar mais ingressos" />
  </section>
  <section className="border-t border-border pt-5"><h3 className="text-lg font-bold">Contrato da compra</h3><p className="my-3 text-xs text-muted-foreground">O contrato registra a oferta aceita. Ele e o resumo baixado não são nota fiscal nem comprovante de estorno.</p>
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
