"use client";
import {useRef,useState} from 'react';
import usePurchaseResource,{purchaseRequest} from './use-purchase-resource';
import {purchaseSummary} from '@/lib/api/purchases.mjs';
export default function useOrderDetails(order,onChanged){
 const detail=usePurchaseResource(order.orderId,false),tickets=usePurchaseResource(order.orderId+'/tickets');
 const [showReceipt,setShowReceipt]=useState(false);
 const receipt=usePurchaseResource(showReceipt?order.orderId+'/receipt':null,false);
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(false),[confirm,setConfirm]=useState(false);
 const lock=useRef(false),cancelKey=useRef(null);
 const refresh=()=>{detail.retry();tickets.retry();if(showReceipt)receipt.retry();onChanged();};
 const copy=async value=>{try{await navigator.clipboard.writeText(value);setNotice('Código copiado.');}catch{setNotice('Não foi possível copiar automaticamente. Selecione o código e copie pelo menu do navegador.');}};
 const download=()=>{
  if(!detail.data||detail.loading)return;
  try{const blob=new Blob(['\uFEFF',purchaseSummary(order,detail.data,receipt.data)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='CineAstra-pedido-'+order.orderId+'.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Resumo baixado, sem valor fiscal.');
  }catch{setError('Não foi possível baixar o resumo.');}
 };
 const cancel=async()=>{
  if(lock.current)return;lock.current=true;setPending(true);setError('');
  try{
   if(!cancelKey.current)cancelKey.current=crypto.randomUUID();
   const data=await purchaseRequest(order.orderId+'/cancel',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':cancelKey.current},body:'{}'});
   if(data.status!=='CANCELADO')throw new Error('Confirmação de cancelamento indisponível.');
   setConfirm(false);setNotice('Pedido cancelado. Isso não confirma um estorno.');refresh();
  }catch(e){setError(e.message);}
  finally{lock.current=false;setPending(false);}
 };
 return {detail,tickets,receipt,showReceipt,setShowReceipt,notice,error,pending,confirm,setConfirm,refresh,copy,download,cancel};
}
