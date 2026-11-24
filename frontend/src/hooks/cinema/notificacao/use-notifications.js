"use client";
import {useEffect,useRef,useState} from 'react';
import { sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
import {notificationItem} from '@/lib/api/notifications.mjs';
const eventName='cineastra-notification-read';
async function request(path='',options={}){
 return readSessionResponse(await sessionFetch('/api/notifications'+path,{cache:'no-store',credentials:'same-origin',...options}));
}
function listPath(type,cursor){
 const query=new URLSearchParams();
 if(type)query.set('type',type);
 if(cursor)query.set('cursor',cursor);
 return query.size?'?'+query.toString():'';
}
export function useNotifications(userId,type=null,role='CLIENTE'){
 const [revision,setRevision]=useState(0),[state,setState]=useState({key:null,items:[],cursor:null,loading:false,error:null});
 const [actionError,setActionError]=useState(''),[pending,setPending]=useState(false);
 const key=`${userId}:${type??''}:${role}:${revision}`,busy=useRef(false),writing=useRef(false),controller=useRef(null);
 useEffect(()=>{
  if(!userId)return;
  const abort=new AbortController();controller.current=abort;busy.current=true;
  // Avoid a slower initial read overwriting a just-confirmed read in another view.
  const confirmed=new Set();
  const receive=event=>{
   if(event.detail?.userId!==userId)return;
   confirmed.add(event.detail.id);
   setState(s=>({...s,items:s.items.map(item=>item.id===event.detail.id?{...item,read:true}:item)}));
  };
  window.addEventListener(eventName,receive);
  request(listPath(type),{signal:abort.signal}).then(data=>{
   if(!Array.isArray(data.items))throw new Error('Lista de notificações inválida.');
   if(!abort.signal.aborted)setState({key,items:data.items.map(row=>notificationItem(row,role)).map(item=>confirmed.has(item.id)?{...item,read:true}:item),cursor:data.pagination?.nextCursor,loading:false,error:null});
  }).catch(e=>{if(!abort.signal.aborted)setState({key,items:[],cursor:null,loading:false,error:e.message});}).finally(()=>{if(!abort.signal.aborted)busy.current=false;});
  return()=>{abort.abort();window.removeEventListener(eventName,receive);};
 },[userId,key,type,role]);
 const visible=state.key===key?state:{items:[],cursor:null,loading:Boolean(userId),error:null};
 const loadMore=async()=>{
  if(busy.current||!visible.cursor)return;
  const abort=controller.current;busy.current=true;setState(s=>({...s,loading:true,error:null}));
  try{
   const data=await request(listPath(type,visible.cursor),{signal:abort.signal});
   if(!Array.isArray(data.items)||data.pagination?.nextCursor===visible.cursor)throw new Error('Paginação inválida.');
   if(!abort.signal.aborted)setState(s=>{
    const existing=new Set(s.items.map(item=>item.id));
    const added=data.items.map(row=>notificationItem(row,role)).filter(item=>!existing.has(item.id));
    return {...s,items:[...s.items,...added],cursor:data.pagination?.nextCursor,loading:false};
   });
  }catch(e){if(!abort.signal.aborted)setState(s=>({...s,loading:false,error:e.message}));}
  finally{if(!abort.signal.aborted)busy.current=false;}
 };
 const markRead=async id=>{
  if(writing.current)return false;
  writing.current=true;setPending(true);setActionError('');
  try{
   const data=await request('/'+id+'/read',{method:'PATCH'});
   if(data.id_notificacao!==id||data.lida!==true)throw new Error('A leitura não foi confirmada.');
   if(!controller.current?.signal.aborted)window.dispatchEvent(new CustomEvent(eventName,{detail:{userId,id}}));
   return true;
  }catch(e){if(!controller.current?.signal.aborted)setActionError(e.message);return false;}
  finally{writing.current=false;setPending(false);}
 };
 return {...visible,ready:!visible.loading,unreadCount:visible.items.filter(item=>!item.read).length,pending,actionError,markRead,loadMore,retry:()=>setRevision(v=>v+1)};
}
