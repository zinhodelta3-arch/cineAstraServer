'use client';

import {useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import ListStatus from '@/components/cinema/home/list-status';
import usePurchaseResource,{purchaseRequest} from '@/hooks/cinema/minhascompras/use-purchase-resource';
import {purchaseDate,purchaseMoney} from '@/lib/api/purchases.mjs';

const states={EM_ANALISE:'Em análise',RECEBIDA:'Aprovada',ENVIADA:'Enviada ao provedor',CONFIRMADA:'Reembolso confirmado',NEGADA:'Negada',FALHOU:'Falha no reembolso',CANCELADA:'Cancelada'};
const openStates=new Set(['EM_ANALISE','RECEBIDA','ENVIADA']);

export default function OrderRefunds({orderId}){
 const path=`${orderId}/refunds`;
 const history=usePurchaseResource(path);
 const [show,setShow]=useState(false),[pending,setPending]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const lock=useRef(false),attempt=useRef(null);
 const open=history.items.some(item=>openStates.has(item.status));

 async function submit(event){
  event.preventDefault();
  if(lock.current)return;
  const fields=new FormData(event.currentTarget);
  const details=String(fields.get('details')).trim();
  const body=JSON.stringify({reason:fields.get('reason'),...(details&&{details})});
  if(attempt.current?.body!==body)attempt.current={body,key:crypto.randomUUID()};
  lock.current=true;
  setPending(true);setError('');setNotice('');
  try{
   await purchaseRequest(path,{method:'POST',body,headers:{'Content-Type':'application/json','Idempotency-Key':attempt.current.key}});
   attempt.current=null;
   setShow(false);setNotice('Solicitação enviada para análise.');
   history.retry();
  }catch(cause){setError(cause.message);}
  finally{lock.current=false;setPending(false);}
 }

 return <section className="cine-order-panel" aria-label="Reembolsos">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="text-lg font-bold">Reembolsos</h3>
   <Button type="button" variant="outline" size="sm" onClick={history.retry} disabled={pending||history.loading}>Atualizar situação</Button>
  </div>
  <ul className="mt-3 space-y-2">{history.items.map(item=><li key={item.id} className="rounded-lg border border-border p-3 text-sm">
   <strong>{states[item.status]??item.status}</strong>
   {item.confirmedAmount&&<p>Valor confirmado {purchaseMoney(item.confirmedAmount)}</p>}
   <p>Recebida em {purchaseDate(item.receivedAt)}.</p>
   {item.status==='EM_ANALISE'&&<p>Previsão de resposta até {purchaseDate(item.responseDueAt)}.</p>}
  </li>)}</ul>
  <ListStatus list={history} empty="Nenhuma solicitação registrada." more="Mais solicitações" />
  {history.data&&!history.data.eligible&&!open&&!history.items.length&&<p className="text-sm text-muted-foreground">O pedido ainda não tem um pagamento disponível para solicitar reembolso.</p>}
  {notice&&<p role="status" className="mb-2 text-sm">{notice}</p>}
  {error&&<p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
  {history.data?.eligible&&!open&&!show&&<Button type="button" variant="outline" size="sm" onClick={()=>setShow(true)}>Solicitar reembolso</Button>}
  {show&&<form className="grid gap-3" onSubmit={submit}>
   <p className="text-sm text-muted-foreground">A equipe analisa o motivo e o valor elegível. Você pode acompanhar a resposta nesta tela.</p>
   <label className="grid gap-1 text-sm">Motivo
    <select name="reason" required disabled={pending} className="rounded-md border border-border bg-background p-2">
     <option value="">Selecione</option><option value="ARREPENDIMENTO">Arrependimento da compra</option>
     <option value="DEFEITO">Problema com a compra</option><option value="OUTRO">Outro motivo</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm">Detalhes opcionais
    <textarea name="details" rows={3} maxLength={1000} disabled={pending} className="rounded-md border border-border bg-background p-2" />
   </label>
   <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={pending} onClick={()=>setShow(false)}>Voltar</Button>
    <Button type="submit" disabled={pending}>{pending?'Enviando…':'Enviar solicitação'}</Button></div>
  </form>}
 </section>;
}
