'use client';

import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
import {operationKey} from '@/lib/api/operation-key.mjs';
import {planMoney} from '@/lib/api/plan-subscription.mjs';
import {STREAMING_ACCESS_CHANGE_EVENT} from '@/hooks/cinema/use-streaming-access';

const states={PENDENTE:'Aguardando pagamento',ATRASADO:'Cobrança em atraso',PAGO:'Pagamento confirmado',RECUSADO:'Pagamento recusado',
 CANCELADO:'Cobrança cancelada',EXPIRADA:'Assinatura expirada',ENVIADA:'Pagamento em processamento',ISENTO:'Isenta'};

async function api(path,{method='GET',body,key,signal}={}){
 return readSessionResponse(await sessionFetch('/api/'+path,{method,signal,cache:'no-store',credentials:'same-origin',
  headers:{...(body&&{'Content-Type':'application/json'}),...(key&&{'Idempotency-Key':key})},...(body&&{body:JSON.stringify(body)})}));
}

export default function SubscriptionPayment({id,onUpdated}){
 const path=`plans/subscription?id=${id}`;
 const [data,setData]=useState(null),[methods,setMethods]=useState([]),[methodId,setMethod]=useState('');
 const [loading,setLoading]=useState(true),[working,setWorking]=useState(false),[error,setError]=useState('');
 const [showNew,setShowNew]=useState(false),[type,setType]=useState('PIX'),[remove,setRemove]=useState(false);
 const lock=useRef(false),keys=useRef(new Map());
 useEffect(()=>{
  const abort=new AbortController();
  Promise.all([api(path,{signal:abort.signal}),api('checkout/methods',{signal:abort.signal})]).then(([subscription,saved])=>{
   if(!abort.signal.aborted){setData(subscription);setMethods(saved.items);setMethod(saved.items[0]?.id??'');}
  }).catch(cause=>{if(!abort.signal.aborted)setError(cause.message);})
   .finally(()=>{if(!abort.signal.aborted)setLoading(false);});
  return()=>abort.abort();
 },[path]);
 async function refresh(){
  const next=await api(path);
  setData(next);
  onUpdated();
  window.dispatchEvent(new Event(STREAMING_ACCESS_CHANGE_EVENT));
  window.dispatchEvent(new Event('cineastra:subscription-change'));
 }
 async function run(work){
  if(lock.current)return;
  lock.current=true;setWorking(true);setError('');
  try{await work();}catch(cause){setError(cause.message);}
  finally{lock.current=false;setWorking(false);}
 }
 const payable=['PENDENTE','ATRASADO'].includes(data?.chargeStatus)
  &&(['PENDENTE','ATIVA'].includes(data?.status)||data?.status==='CANCELADA'&&data.chargeStatus==='ATRASADO');
 const processing=payable&&data.paymentStatus==='PENDENTE';
 async function pay(){
  await run(async()=>{
   const fingerprint=[data.chargeId,methodId,data.paymentStatus==='RECUSADO'?data.paymentId:'new'].join(':');
   const storageKey='cineastra:subscription-payment:'+fingerprint;
   let key=keys.current.get(storageKey);
   try{key=key??sessionStorage.getItem(storageKey);}catch{}
   key=key??operationKey();
   keys.current.set(storageKey,key);
   try{sessionStorage.setItem(storageKey,key);}catch{}
   const result=await api('checkout/pay',{method:'POST',body:{chargeId:data.chargeId,methodId},key});
   if(result?.id){
    setData(previous=>({...previous,paymentId:result.id,paymentStatus:result.status}));
    await api('checkout/reconcile',{method:'POST',body:{paymentId:result.id}});
   }
   await refresh();
  });
 }
 function saveMethod(event){
  event.preventDefault();
  const last4=new FormData(event.currentTarget).get('last4');
  run(async()=>{
   const fresh=await api('checkout/methods',{method:'POST',body:{type,...(type!=='PIX'&&{last4})}});
   setMethods(previous=>[fresh,...previous]);setMethod(fresh.id);setShowNew(false);
  });
 }
 function removeMethod(){
  run(async()=>{
   await api(`checkout/methods?id=${methodId}`,{method:'DELETE'});
   const remaining=methods.filter(method=>method.id!==methodId);
   setMethods(remaining);setMethod(remaining[0]?.id??'');setRemove(false);
  });
 }
 const state=['EXPIRADA','CANCELADA'].includes(data?.status)&&!payable
  ? data.status==='CANCELADA'?'CANCELADO':'EXPIRADA'
  : processing?'ENVIADA':payable&&data.paymentStatus==='RECUSADO'?'RECUSADO':data?.chargeStatus??data?.status;
 return <section className="mt-3 grid gap-3 rounded-lg border border-border p-4" aria-label="Pagamento da assinatura">
  {loading&&<p role="status">Consultando cobrança…</p>}
  {data&&<div role="status"><strong>{states[state]??'Sem cobrança disponível'}</strong>
   {data.chargeAmount!=null&&<p>{planMoney(data.chargeAmount)}{data.chargeDue&&` · vencimento ${data.chargeDue.split('-').reverse().join('/')}`}</p>}
   {data.status==='ATIVA'&&data.chargeStatus==='PAGO'&&<p>Assinatura ativa.</p>}
  </div>}
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  {payable&&!processing&&<>
   <label className="grid gap-1">Método salvo<select className="rounded border border-border bg-background p-2" value={methodId}
    onChange={event=>{setMethod(event.target.value);setRemove(false);}} disabled={working}>
    <option value="">Selecione um método</option>{methods.map(m=><option key={m.id} value={m.id}>{m.identification}</option>)}
   </select></label>
   <div className="flex flex-wrap gap-2">
    <Button type="button" onClick={pay} disabled={working||!methodId}>{working?'Processando…':'Pagar assinatura'}</Button>
    <Button type="button" variant="outline" onClick={()=>setShowNew(!showNew)} disabled={working}>Cadastrar método</Button>
    {methodId&&<Button type="button" variant="outline" onClick={()=>setRemove(!remove)} disabled={working}>Remover método</Button>}
   </div>
   {remove&&<div className="flex flex-wrap items-center gap-2"><span>Remover o método selecionado?</span><Button type="button" variant="destructive" disabled={working} onClick={removeMethod}>Confirmar remoção</Button></div>}
   {showNew&&<form onSubmit={saveMethod} className="flex flex-wrap items-end gap-2">
    <label className="grid gap-1">Tipo de método simulado<select className="rounded border border-border bg-background p-2" value={type} onChange={event=>setType(event.target.value)}>
     <option value="PIX">Pix</option><option value="CREDITO">Crédito</option><option value="DEBITO">Débito</option>
    </select></label>
    {type!=='PIX'&&<label className="grid gap-1">Últimos quatro dígitos<input className="rounded border border-border bg-background p-2" name="last4" inputMode="numeric" required pattern="[0-9]{4}" maxLength={4} /></label>}
    <Button type="submit" disabled={working}>Salvar método</Button>
   </form>}
  </>}
  {data?.paymentId&&processing&&<Button variant="outline" disabled={working} onClick={()=>run(async()=>{
   await api('checkout/reconcile',{method:'POST',body:{paymentId:data.paymentId}});
   await refresh();
  })}>Consultar pagamento</Button>}
  {!loading&&!processing&&<Button variant="ghost" disabled={working} onClick={()=>run(refresh)}>Atualizar situação</Button>}
 </section>;
}
