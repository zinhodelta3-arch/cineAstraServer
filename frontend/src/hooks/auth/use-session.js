"use client";
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { sessionRequest } from './use-auth-form';
import { readSessionResponse } from '@/lib/auth/session-response.mjs';
export function useSession() {
 const path=usePathname();const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 const exiting=useRef(false);
 useEffect(()=>{
  const abort=new AbortController();
  let version=0;
  const load=async()=>{
   const current=++version;
   try {
    const response=await fetch('/api/session/me',{cache:'no-store',credentials:'same-origin',signal:abort.signal});
    const data=await readSessionResponse(response);
    if(!abort.signal.aborted&&current===version){setUser(data.user||null);setMessage('');}
   } catch {
    if(!abort.signal.aborted&&current===version){setUser(null);setMessage('Não foi possível verificar a sessão. Tente atualizar a página.');}
   } finally {if(!abort.signal.aborted&&current===version)setLoading(false);}
  };
  load();window.addEventListener('cineastra-session',load);window.addEventListener('focus',load);
  return()=>{abort.abort();window.removeEventListener('cineastra-session',load);window.removeEventListener('focus',load);};
 },[path]);
 const logout=async()=>{
  if(exiting.current)return;exiting.current=true;setPending(true);setMessage('');
  try{await sessionRequest('logout',{});setUser(null);window.dispatchEvent(new Event('cineastra-session'));window.location.replace('/auth/login');}
  catch{setMessage('Não foi possível sair. Tente novamente.');exiting.current=false;setPending(false);}
 };
 return {user,loading,message,pending,logout};
}
