"use client";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useCart} from '@/components/cart/cart-provider';
import {useSession} from '@/hooks/auth/use-session';
import {cartOrder} from '@/lib/api/cart-order.mjs';
import { sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';

async function quoteCart(input, signal) {
 const response=await sessionFetch('/api/cart/quote',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal});
 return readSessionResponse(response);
}

export default function useCinemaCart({enabled=true}={}){
 const router=useRouter(),cart=useCart(),session=useSession();
 const [coupon,setCouponValue]=useState(''),[state,setState]=useState({key:null,quote:null,pending:false,error:null});
 const [auto,setAuto]=useState(null),[revision,setRevision]=useState(0);
 const controller=useRef(null);
 let input=null,issue=null;try{input=cartOrder(cart.items);}catch(e){issue=e.message;}
 const baseInput=enabled&&input&&session.user?.role==='CLIENTE'?JSON.stringify(input):null;
 const baseKey=baseInput?JSON.stringify([session.user.id,baseInput,revision]):null;
 useEffect(()=>{
  if(!baseKey)return;
  const abort=new AbortController();
  const timer=setTimeout(()=>{
   const [,data]=JSON.parse(baseKey);
   quoteCart(JSON.parse(data),abort.signal).then(quote=>{
    if(!abort.signal.aborted)setAuto({key:baseKey,quote,error:null});
   }).catch(error=>{
    if(!abort.signal.aborted)setAuto({key:baseKey,quote:null,error:error.message});
   });
  },250);
  return()=>{clearTimeout(timer);abort.abort();};
 },[baseKey]);
 const couponCode=coupon.trim().toUpperCase();
 const key=JSON.stringify([baseKey,couponCode]);
 useEffect(()=>()=>controller.current?.abort(),[key]);
 const baseCurrent=auto?.key===baseKey?auto:null;
 const couponState=state.key===key?state:null;
 const quote=couponState?.quote??baseCurrent?.quote;
 const setCoupon=value=>{
  if(value.trim().toUpperCase()!==couponCode){
   controller.current?.abort();
   setState({key:null,quote:null,pending:false,error:null});
  }
  setCouponValue(value);
 };
 const validateCoupon=async()=>{
  if(!input||session.user?.role!=='CLIENTE'||couponState?.pending||!couponCode)return;
  if(!/^[A-Z0-9_-]{1,50}$/.test(couponCode)){
   setState({key,quote:null,pending:false,error:'Use letras, números, hífen ou sublinhado no código do cupom.'});
   return;
  }
  controller.current?.abort();const abort=new AbortController();controller.current=abort;
  setState({key,quote:null,pending:true,error:null});
  try{
   const validated=await quoteCart({...input,couponCode},abort.signal);
   if(!abort.signal.aborted){
    if(validated.couponCode!==couponCode)throw new Error('O desconto não foi confirmado. Tente validar o cupom novamente.');
    setState({key,quote:validated,pending:false,error:null});
   }
  }catch(e){if(!abort.signal.aborted)setState({key,quote:null,pending:false,error:e.message});}
 };
 const items=cart.items.map(item=>{
  const index=input?.lines.findIndex(line=>line.kind===item.purchaseKind&&line.id===item.sourceId&&(line.kind!=='SESSION'||line.seatId===item.seatId));
  const line=index>=0?quote?.lines[index]:null;
  return {...item,price:line?Number(line.unitPrice):item.price,originalPrice:line?line.originalPrice:item.originalPrice,discountSources:line?line.discountSources:item.discountSources,quoted:Boolean(line)};
 });
 const total=quote?Number(quote.total):cart.total;
 return {items,itemCount:cart.itemCount,total,
  increase:item=>{if(item.purchaseKind!=='SESSION')cart.updateQuantity(item.id,item.type,item.details,Math.min(100,item.quantity+1));},
  decrease:item=>cart.updateQuantity(item.id,item.type,item.details,item.quantity-1),
  remove:item=>cart.removeItem(item.id,item.type,item.details),goBack:()=>router.back(),
  savedForLater:cart.savedForLater,resumeSavedItems:cart.resumeSavedItems,
  summary:{quote,pending:Boolean(baseKey&&!baseCurrent),error:baseCurrent?.error,
   issue:cart.items.length?issue:null,session,coupon,setCoupon,validateCoupon,couponState,baseTotal:baseCurrent?.quote?.total,
   retryQuote:()=>setRevision(value=>value+1),itemCount:cart.itemCount,total}};
}
