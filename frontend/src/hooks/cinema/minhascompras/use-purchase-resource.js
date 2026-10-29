"use client";
import {useEffect,useRef,useState} from 'react';
import {readSessionResponse} from '@/lib/auth/session-response.mjs';
export async function purchaseRequest(path='',options={}){
 return readSessionResponse(await fetch('/api/purchases'+(path?'/'+path:''),{cache:'no-store',credentials:'same-origin',...options}));
}
export default function usePurchaseResource(path,paginated=true){
 const [revision,setRevision]=useState(0),[state,setState]=useState({key:null,data:null,items:[],cursor:null,loading:false,error:null});
 const key=path+':'+revision,controller=useRef(null),busy=useRef(false);
 useEffect(()=>{
  if(path===null)return;
  const abort=new AbortController();controller.current=abort;busy.current=true;
  purchaseRequest(path,{signal:abort.signal}).then(data=>{
   if(paginated&&!Array.isArray(data.items))throw new Error('Lista de compras inválida.');
   if(!abort.signal.aborted)setState({key,data,items:data.items||[],cursor:data.pagination?.nextCursor,loading:false,error:null});
  }).catch(e=>{if(!abort.signal.aborted)setState({key,data:null,items:[],cursor:null,loading:false,error:e.message});}).finally(()=>{if(!abort.signal.aborted)busy.current=false;});
  return()=>abort.abort();
 },[path,key,paginated]);
 const visible=state.key===key?state:{data:null,items:[],cursor:null,loading:path!==null,error:null};
 const loadMore=async()=>{
  if(busy.current||!visible.cursor)return;
  const abort=controller.current;busy.current=true;setState(s=>({...s,loading:true,error:null}));
  try{
   const data=await purchaseRequest(path+'?cursor='+encodeURIComponent(visible.cursor),{signal:abort.signal});
   if(!Array.isArray(data.items)||data.pagination?.nextCursor===visible.cursor)throw new Error('Paginação inválida.');
   if(!abort.signal.aborted)setState(s=>({...s,items:[...s.items,...data.items],cursor:data.pagination?.nextCursor,loading:false}));
  }catch(e){if(!abort.signal.aborted)setState(s=>({...s,loading:false,error:e.message}));}
  finally{if(!abort.signal.aborted)busy.current=false;}
 };
 return {...visible,loadMore,retry:()=>setRevision(v=>v+1)};
}
