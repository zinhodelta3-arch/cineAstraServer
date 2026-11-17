"use client";
import {useState} from 'react';
import usePurchaseResource from './use-purchase-resource';
export default function usePurchaseHistory(){
 const list=usePurchaseResource('');
 const [query,setQuery]=useState(''),[status,setStatus]=useState('all'),[selection,setSelection]=useState(null);
 const matching=list.items.filter(order=>(status==='all'||order.financialStatus===status)&&(!query||order.createdAt&&
  new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(order.createdAt))===query));
 return {list,query,setQuery,status,setStatus,selection,setSelection,matching};
}
