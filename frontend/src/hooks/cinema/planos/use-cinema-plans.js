"use client";
import {operationKey} from '@/lib/api/operation-key.mjs';
import {useEffect,useRef,useState} from 'react';
import {Ticket} from 'lucide-react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {useSession} from '@/hooks/auth/use-session';
import { sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
import {planBenefitRows,planMoney} from '@/lib/api/plan-subscription.mjs';
import {STREAMING_ACCESS_CHANGE_EVENT} from '@/hooks/cinema/use-streaming-access';

const emptyMine = { items:[], loading:true, error:null, cursor:null };

async function request(action,body,signal,key){
 return readSessionResponse(await sessionFetch('/api/plans/'+action,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal,headers:body?{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})}:undefined,...(body?{body:JSON.stringify(body)}:{})}));
}
export default function useCinemaPlans({ management = false } = {}){
 const session=useSession(),userId=session.user?.id,client=session.user?.role==='CLIENTE';
 const list=usePublicList(!management||client?'/plans?limit=12':null);
 const [billing,setBilling]=useState('monthly'),[selected,setSelected]=useState(null),[autoRenew,setAutoRenew]=useState(false);
 const [modality,setModality]=useState('INDIVIDUAL'),[divisionMode,setDivisionMode]=useState('TITULAR_PAGA');
 const [offer,setOffer]=useState(null),[accepted,setAccepted]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false),[result,setResult]=useState(null);
 const [mineState,setMine]=useState(emptyMine),[revision,setRevision]=useState(0);
 const mine=mineState.owner===userId?mineState:emptyMine;
 const [cancelNotice,setCancelNotice]=useState(null);
 const [change,setChange]=useState(null);
 const [changeResult,setChangeResult]=useState(null);
 const lock=useRef(false),generation=useRef(0),keys=useRef(new Map()),listLock=useRef(false);
 const identity=useRef(userId);identity.current=userId;
 useEffect(()=>{
  generation.current++;setOffer(null);setAccepted(false);setResult(null);setError('');setCancelNotice(null);setChange(null);setChangeResult(null);
 },[userId]);
 useEffect(()=>{
  if(!management||!client)return;
  const abort=new AbortController();listLock.current=true;
  setMine({...emptyMine,owner:userId});
  request('mine',null,abort.signal).then(data=>{
   if(!Array.isArray(data.items))throw new Error('Resposta de assinaturas inválida.');
   if(!abort.signal.aborted)setMine({owner:userId,items:data.items,cursor:data.pagination?.nextCursor,loading:false,error:null});
  }).catch(e=>{if(!abort.signal.aborted)setMine({...emptyMine,owner:userId,loading:false,error:e.message});}).finally(()=>{if(!abort.signal.aborted)listLock.current=false;});
  return()=>abort.abort();
 },[management,client,userId,revision]);
 const loadMore=async()=>{
  if(listLock.current||!mine.cursor)return;
  const owner=userId;listLock.current=true;setMine(s=>({...s,loading:true,error:null}));
  try{
   const data=await request('mine?cursor='+encodeURIComponent(mine.cursor));
   if(!Array.isArray(data.items)||data.pagination?.nextCursor===mine.cursor)throw new Error('Paginação inválida.');
   if(identity.current===owner)setMine(s=>({...s,items:[...s.items,...data.items],cursor:data.pagination?.nextCursor,loading:false}));
  }catch(e){if(identity.current===owner)setMine(s=>({...s,error:e.message,loading:false}));}
  finally{if(identity.current===owner)listLock.current=false;}
 };
 const reset=()=>{generation.current++;setOffer(null);setAccepted(false);setError('');setResult(null);};
 const changeBilling=value=>{if(lock.current)return;setBilling(value);reset();};
 const changeModality=value=>{if(lock.current)return;setModality(value);if(value==='INDIVIDUAL'&&!change)setDivisionMode('TITULAR_PAGA');reset();};
 const choose=id=>{if(lock.current)return;setSelected(id);reset();};
 const chooseDraft=draft=>{if(lock.current)return;setBilling(draft.period==='ANUAL'?'annual':'monthly');setAutoRenew(false);setModality(draft.modality??'INDIVIDUAL');choose(draft.planId);};
 const startChange=(item,proposal=null)=>{
  if(lock.current)return;
  const choice=proposal??item;
  setChange(item);setChangeResult(null);setBilling(choice.period==='ANUAL'?'annual':'monthly');setAutoRenew(item.autoRenew);
  setModality(choice.modality??(item.maxMembers>=4?'FAMILIA':item.maxMembers>=2?'DUPLA':'INDIVIDUAL'));
  choose(choice.planId);
 };
 const selectedPlan=list.items.find(plan=>plan.id===selected);
 const priceFor=plan=>plan?.modalities?.find(option=>option.modality===modality)?.[billing==='monthly'?'monthlyPrice':'annualPrice'];
 const selectedPrice=priceFor(selectedPlan);
 const input={planId:selected,period:billing==='monthly'?'MENSAL':'ANUAL',modality,autoRenew,divisionMode:change?.divisionMode??divisionMode};
 const review=async()=>{
  if(lock.current||!(Number(selectedPrice)>0)||!client)return;
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
   if(change){
    const data=await request('change',{...body,subscriptionId:change.id});
    if(!data.scheduledChange?.effectiveOn)throw new Error('Confira a situação da troca antes de tentar novamente.');
    if(version===generation.current){
     setChange(null);reset();setRevision(v=>v+1);
     setChangeResult(data.scheduledChange);
    }
    return;
   }
   let key=keys.current.get(storageKey);
   if(!key){try{key=sessionStorage.getItem(storageKey);}catch{/* Memory fallback. */}}
   if(!key)key=operationKey();
   keys.current.set(storageKey,key);
   try{sessionStorage.setItem(storageKey,key);}catch{/* Memory fallback. */}
   const data=await request('subscribe',body,undefined,key);
   if(!data.id||!data.status)throw new Error('Resposta incompleta. Consulte suas assinaturas antes de tentar novamente.');
   if(version===generation.current){setResult(data);setRevision(v=>v+1);}
  }catch(e){if(version===generation.current)setError(e.message);}
  finally{lock.current=false;setPending(false);}
 };
 const plans=list.items.map(plan=>{
  const price=priceFor(plan);
  return {...plan,icon:Ticket,benefitRows:planBenefitRows(plan),available:Number(price)>0,priceLabel:planMoney(Number(price)>0?price:null)};
 });
 const cancel=async subscriptionId=>{
  if(lock.current||!client)return false;
  lock.current=true;setPending(true);setError('');setCancelNotice(null);
  try{
   const data=await request('cancel',{subscriptionId});
   if(data.id!==subscriptionId||data.status!=='CANCELADA')throw new Error('Confira a situação da assinatura antes de tentar novamente.');
   if(identity.current!==userId)return false;
   reset();
   setCancelNotice(data.refundRequestRequired?'Assinatura cancelada. A solicitação de reembolso ainda precisa ser registrada.':data.refund?'Assinatura cancelada. A solicitação de reembolso foi registrada.':'Assinatura cancelada.');
   setRevision(v=>v+1);
   window.dispatchEvent(new Event(STREAMING_ACCESS_CHANGE_EVENT));
   window.dispatchEvent(new Event('cineastra:subscription-change'));
   return true;
  }catch(e){if(identity.current===userId)setError(e.message);return false;}
  finally{lock.current=false;setPending(false);}
 };
 return {
  hero:{showPlans:()=>document.getElementById('planos')?.scrollIntoView({behavior:'smooth'})},
  catalog:{list,plans,billing,setBilling:changeBilling,modality,setModality:changeModality,periodFor:billing==='monthly'?'/mês':'/ano',startSubscription:choose,pending},
  subscription:{selectedPlanAvailable:Number(selectedPrice)>0,selectedPrice,selectedPlanName:selectedPlan?.name,planNames:Object.fromEntries(plans.map(plan=>[plan.id,plan.name])),selected,billing,modality,divisionMode,changeDivision:value=>{if(!lock.current){setDivisionMode(value);reset();}},autoRenew,changeAutoRenew:value=>{if(!lock.current){setAutoRenew(value);reset();}},offer,accepted,setAccepted,error,pending,result,review,subscribe,session,chooseDraft,
   cancel,cancelNotice,change,startChange,changeResult,editChoice:()=>{if(!lock.current)reset();},
   resetChange:()=>{if(!lock.current){setChange(null);setSelected(null);setChangeResult(null);reset();}},
   mine:management&&client?{...mine,loadMore,retry:()=>setRevision(v=>v+1)}:null}
 };
}
