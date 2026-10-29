"use client";
import {useState} from 'react';
import usePurchaseResource from './use-purchase-resource';
export default function usePurchaseHistory(){
 const list=usePurchaseResource('');
 const [query,setQuery]=useState(''),[status,setStatus]=useState('all'),[selection,setSelection]=useState(null);
 const matching=list.items.filter(order=>(status==='all'||order.financialStatus===status)&&order.orderId.includes(query.trim()));
 return {list,query,setQuery,status,setStatus,selection,setSelection,matching};
}
