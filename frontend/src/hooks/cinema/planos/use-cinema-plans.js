"use client";
import {useEffect,useRef,useState} from 'react';
import {Ticket} from 'lucide-react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {useSession} from '@/hooks/auth/use-session';
import {readSessionResponse} from '@/lib/auth/session-response.mjs';
import {planBenefits,planMoney} from '@/lib/api/plan-subscription.mjs';

async function request(action,body,signal,key){
 return readSessionResponse(await fetch('/api/plans/'+action,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal,headers:body?{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})}:undefined,...(body?{body:JSON.stringify(body)}:{})}));
}
export default function useCinemaPlans(){
 const list=usePublicList('/plans?limit=12'),session=useSession(),userId=session.user?.id;
 const [billing,setBilling]=useState('monthly'),[selected,setSelected]=useState(null),[autoRenew,setAutoRenew]=useState(false);
 const [offer,setOffer]=useState(null),[accepted,setAccepted]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false),[result,setResult]=useState(null);
 const [mine,setMine]=useState({items:[],loading:false,error:null,cursor:null}),[revision,setRevision]=useState(0);
 const lock=useRef(false),generation=useRef(0),keys=useRef(new Map()),listLock=useRef(false);
 const identity=useRef(userId);identity.current=userId;
 const client=session.user?.role==='CLIENTE';
 useEffect(()=>{
  generation.current++;setOffer(null);setAccepted(false);setResult(null);setError('');
 },[userId]);
 useEffect(()=>{
  if(!client)return;
  const abort=new AbortController();listLock.current=true;
  setMine({items:[],loading:true,error:null,cursor:null});
  request('mine',null,abort.signal).then(data=>{
   if(!Array.isArray(data.items))throw new Error('Resposta de assinaturas inválida.');
   if(!abort.signal.aborted)setMine({items:data.items,cursor:data.pagination?.nextCursor,loading:false,error:null});
  }).catch(e=>{if(!abort.signal.aborted)setMine({items:[],loading:false,cursor:null,error:e.message});}).finally(()=>{if(!abort.signal.aborted)listLock.current=false;});
  return()=>abort.abort();
 },[client,userId,revision]);
 const loadMore=async()=>{
  if(listLock.current||!mine.cursor)return;
  const owner=userId;listLock.current=true;setMine(s=>({...s,loading:true,error:null}));
  try{
   const data=await request('mine?cursor='+encodeURIComponent(mine.cursor));
   if(!Array.isArray(data.items)||data.pagination?.nextCursor===mine.cursor)throw new Error('Paginação inválida.');
   if(identity.current===owner)setMine(s=>({...s,items:[...s.items,...data.items],cursor:data.pagination?.nextCursor,loading:false}));
  }catch(e){if(identity.current===owner)setMine(s=>({...s,error:e.message,loading:false}));}
  finally{listLock.current=false;}
 };
 const reset=()=>{generation.current++;setOffer(null);setAccepted(false);setError('');setResult(null);};
 const changeBilling=value=>{if(lock.current)return;setBilling(value);reset();};
 const choose=id=>{if(lock.current)return;setSelected(id);reset();document.getElementById('assinar')?.scrollIntoView({behavior:'smooth',block:'start'});};
 const input={planId:selected,period:billing==='monthly'?'MENSAL':'ANUAL',autoRenew,divisionMode:'TITULAR_PAGA'};
 const review=async()=>{
  if(lock.current||!selected||!client)return;
  lock.current=true;setPending(true);reset();const version=generation.current;
  try{
   const data=await request('summary',input);
   if(!data.offerHash||!data.terms?.body?.text||!data.privacy?.body?.text||!data.offer)throw new Error('Contrato indisponível. Tente novamente mais tarde.');
   if(version===generation.current)setOffer(data);
  }catch(e){if(version===generation.current)setError(e.message);}
  finally{lock.current=false;setPending(false);}
 };
 const subscribe=async()=>{
  if(lock.current||!accepted||!offer||!client||result)return;
  lock.current=true;setPending(true);setError('');const version=generation.current;
  const body={...input,acceptance:{accepted:true,offerHash:offer.offerHash}};
  // Reuse the same key for retries, including after a reload in this tab.
  const storageKey='cineastra-plan:'+userId+':'+offer.offerHash;
  try{
   let key=keys.current.get(storageKey);
   if(!key){try{key=sessionStorage.getItem(storageKey);}catch{/* Memory fallback. */}}
   if(!key)key=crypto.randomUUID();
   keys.current.set(storageKey,key);
   try{sessionStorage.setItem(storageKey,key);}catch{/* Memory fallback. */}
   const data=await request('subscribe',body,undefined,key);
   if(!data.id||!data.status)throw new Error('Resposta incompleta. Consulte suas assinaturas antes de tentar novamente.');
   if(version===generation.current){setResult(data);setRevision(v=>v+1);}
  }catch(e){if(version===generation.current)setError(e.message);}
  finally{lock.current=false;setPending(false);}
 };
 const plans=list.items.map(plan=>({...plan,icon:Ticket,badge:'Publicado',tagline:plan.description,benefits:planBenefits(plan),priceLabel:planMoney(billing==='monthly'?plan.monthlyPrice:plan.annualPrice)}));
 return {
  hero:{showPlans:()=>document.getElementById('planos')?.scrollIntoView({behavior:'smooth'})},
  catalog:{list,plans,billing,setBilling:changeBilling,periodFor:billing==='monthly'?'/mês':'/ano',startSubscription:choose,pending},
  subscription:{selectedPlanName:plans.find(p=>p.id===selected)?.name,selected,billing,autoRenew,changeAutoRenew:value=>{if(!lock.current){setAutoRenew(value);reset();}},offer,accepted,setAccepted,error,pending,result,review,subscribe,session,
   mine:client?{...mine,loadMore,retry:()=>setRevision(v=>v+1)}:null}
 };
}
