"use client";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useCart} from '@/components/cart/cart-provider';
import {useSession} from '@/hooks/auth/use-session';
import {cartOrder} from '@/lib/api/cart-order.mjs';
import {readSessionResponse} from '@/lib/auth/session-response.mjs';
export default function useCinemaCart(){
 const router=useRouter(),cart=useCart(),session=useSession();
 const [coupon,setCoupon]=useState(''),[state,setState]=useState({key:null,quote:null,pending:false,error:null});
 const controller=useRef(null);
 let input=null,issue=null;try{input=cartOrder(cart.items,coupon);}catch(e){issue=e.message;}
 const key=JSON.stringify([session.user?.id,input,cart.items.map(i=>[i.id,i.details,i.quantity]),coupon]);
 useEffect(()=>()=>controller.current?.abort(),[key]);
 const current=state.key===key?state:{quote:null,pending:false,error:null};
 const calculate=async()=>{
  if(!input||session.user?.role!=='CLIENTE'||current.pending)return;
  controller.current?.abort();const abort=new AbortController();controller.current=abort;
  setState({key,quote:null,pending:true,error:null});
  try{
   const response=await fetch('/api/cart/quote',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:abort.signal});
   const quote=await readSessionResponse(response);
   if(!abort.signal.aborted)setState({key,quote,pending:false,error:null});
  }catch(e){if(!abort.signal.aborted)setState({key,quote:null,pending:false,error:e.message});}
 };
 const items=cart.items.map(item=>{
  const line=current.quote?.lines.find(line=>line.category===item.purchaseKind&&line.id===item.sourceId);
  return {...item,price:line?Number(line.unitPrice):item.price,quoted:Boolean(line)};
 });
 return {items,itemCount:cart.itemCount,total:current.quote?Number(current.quote.total):cart.total,
  increase:item=>cart.updateQuantity(item.id,item.type,item.details,Math.min(100,item.quantity+1)),
  decrease:item=>cart.updateQuantity(item.id,item.type,item.details,item.quantity-1),
  remove:item=>cart.removeItem(item.id,item.type,item.details),goBack:()=>router.back(),
  summary:{...current,issue:cart.items.length?issue:null,session,coupon,setCoupon,calculate,itemCount:cart.itemCount,total:current.quote?Number(current.quote.total):cart.total}};
}
