"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { sessionRequest } from './use-auth-form';
export function useSession() {
 const path=usePathname();const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 useEffect(()=>{
  const abort=new AbortController();
  const load=async()=>{try{const response=await fetch('/api/session/me',{cache:'no-store',signal:abort.signal});const data=await response.json();if(!abort.signal.aborted){setUser(data.user||null);setMessage(response.ok?'':data.message||'Não foi possível verificar a sessão.');}}catch{if(!abort.signal.aborted)setMessage('Não foi possível verificar a sessão.');}finally{if(!abort.signal.aborted)setLoading(false);}};
  load();window.addEventListener('cineastra-session',load);return()=>{abort.abort();window.removeEventListener('cineastra-session',load);};
 },[path]);
 const logout=async()=>{if(pending)return;setPending(true);try{await sessionRequest('logout',{});window.location.assign('/auth/login');}catch{setMessage('Não foi possível sair. Tente novamente.');setPending(false);}};
 return {user,loading,message,pending,logout};
}
