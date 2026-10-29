"use client";
import {useEffect,useState} from 'react';
import {publicGet} from '@/lib/api/public-api.mjs';
export default function useSupportCenter(){
 const [search,setSearch]=useState(''),[revision,setRevision]=useState(0);
 const [state,setFaq]=useState({revision:null,items:[],loading:true,error:null});
 const faq=state.revision===revision?state:{items:[],loading:true,error:null};
 useEffect(()=>{
  const abort=new AbortController();
  publicGet('/content/faq',{signal:abort.signal}).then(data=>{
   if(!Array.isArray(data.body?.items))throw new Error('FAQ publicado em formato inválido.');
   if(!abort.signal.aborted)setFaq({revision,items:data.body.items,loading:false,error:null});
  }).catch(e=>{if(!abort.signal.aborted)setFaq({revision,items:[],loading:false,error:e.message});});
  return()=>abort.abort();
 },[revision]);
 const term=search.trim().toLocaleLowerCase('pt-BR');
 return {search,changeSearch:e=>setSearch(e.target.value),clearSearch:()=>setSearch(''),faq:{...faq,filtered:faq.items.filter(item=>(item.question+' '+item.answer).toLocaleLowerCase('pt-BR').includes(term)),retry:()=>setRevision(v=>v+1)}};
}
