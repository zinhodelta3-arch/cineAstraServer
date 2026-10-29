"use client";
import {useEffect,useRef,useState} from 'react';
import {readSessionResponse} from '@/lib/auth/session-response.mjs';
export async function profileRequest(path='',method='GET',body,signal){
 return readSessionResponse(await fetch('/api/profile'+(path?'/'+path:''),{method,cache:'no-store',credentials:'same-origin',signal,headers:body?{'Content-Type':'application/json'}:undefined,...(body?{body:JSON.stringify(body)}:{})}));
}
export default function useProfileResource(path){
 const [revision,setRevision]=useState(0),[state,setState]=useState({key:null,data:null,items:[],cursor:null,loading:false,error:null});
 const key=path+':'+revision,controller=useRef(null),busy=useRef(false);
 useEffect(()=>{
  if(path===null)return;
  const abort=new AbortController();controller.current=abort;busy.current=true;
  profileRequest(path,'GET',undefined,abort.signal).then(data=>{
   if(!abort.signal.aborted)setState({key,data,items:data.items||[],cursor:data.pagination?.nextCursor,loading:false,error:null});
  }).catch(e=>{if(!abort.signal.aborted)setState({key,data:null,items:[],cursor:null,loading:false,error:e.message});}).finally(()=>{if(!abort.signal.aborted)busy.current=false;});
  return()=>abort.abort();
 },[path,key]);
 const visible=state.key===key?state:{data:null,items:[],cursor:null,loading:path!==null,error:null};
 const loadMore=async()=>{
  if(busy.current||!visible.cursor)return;
  const abort=controller.current;busy.current=true;setState(s=>({...s,loading:true,error:null}));
  try{
   const data=await profileRequest(path+'?cursor='+encodeURIComponent(visible.cursor),'GET',undefined,abort.signal);
   if(!Array.isArray(data.items)||data.pagination?.nextCursor===visible.cursor)throw new Error('Paginação inválida.');
   if(!abort.signal.aborted)setState(s=>({...s,items:[...s.items,...data.items],cursor:data.pagination?.nextCursor,loading:false}));
  }catch(e){if(!abort.signal.aborted)setState(s=>({...s,loading:false,error:e.message}));}
  finally{if(!abort.signal.aborted)busy.current=false;}
 };
 return {...visible,loadMore,retry:()=>setRevision(v=>v+1)};
}
