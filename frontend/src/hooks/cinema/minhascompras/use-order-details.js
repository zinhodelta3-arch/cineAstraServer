"use client";
import { copyText } from '@/lib/copy-text.mjs';
import {operationKey} from '@/lib/api/operation-key.mjs';
import {useEffect,useRef,useState} from 'react';
import usePurchaseResource,{purchaseRequest} from './use-purchase-resource';
import {sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
export default function useOrderDetails(order,onChanged){
 const detail=usePurchaseResource(order.orderId,false),tickets=usePurchaseResource(order.orderId+'/tickets');
 const [showReceipt,setShowReceipt]=useState(false);
 const receipt=usePurchaseResource(showReceipt?order.orderId+'/receipt':null,false);
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(false),[confirm,setConfirm]=useState(false);
 const [downloading,setDownloading]=useState(false);
 const lock=useRef(false),cancelKey=useRef(null),downloadRequest=useRef(null);
 useEffect(()=>()=>downloadRequest.current?.abort(),[]);
 const refresh=()=>{detail.retry();tickets.retry();if(showReceipt)receipt.retry();onChanged();};
 const copy=async value=>{setNotice('');setError('');try{await copyText(value);setNotice('Código copiado.');}catch{setError('Não foi possível copiar automaticamente. Selecione o código e copie pelo menu do navegador.');}};
 const download=async()=>{
  if(downloadRequest.current)return;
  const abort=new AbortController();downloadRequest.current=abort;setDownloading(true);setError('');setNotice('');
  try{
   const response=await sessionFetch('/api/purchases/'+order.orderId+'/pdf',{signal:abort.signal,cache:'no-store'});
   if(!response.ok)await readSessionResponse(response);
   if(response.headers.get('Content-Type')!=='application/pdf')throw new Error('Comprovante indisponível.');
   const blob=await response.blob();
   if(abort.signal.aborted)return;
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='CineAstra-pedido-'+order.orderId+'.pdf';document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Comprovante baixado.');
  }catch(error){if(!abort.signal.aborted)setError(error.message);}
  finally{downloadRequest.current=null;if(!abort.signal.aborted)setDownloading(false);}
 };
 const cancel=async()=>{
  if(lock.current)return;lock.current=true;setPending(true);setError('');
  try{
   if(!cancelKey.current)cancelKey.current=operationKey();
   const data=await purchaseRequest(order.orderId+'/cancel',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':cancelKey.current},body:'{}'});
   if(data.status!=='CANCELADO')throw new Error('Confirmação de cancelamento indisponível.');
   setConfirm(false);setNotice('Pedido cancelado. Isso não confirma um estorno.');refresh();
  }catch(e){setError(e.message);}
  finally{lock.current=false;setPending(false);}
 };
 return {detail,tickets,receipt,showReceipt,setShowReceipt,notice,error,pending,downloading,confirm,setConfirm,refresh,copy,download,cancel};
}
