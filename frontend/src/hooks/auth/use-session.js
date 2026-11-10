"use client";
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { sessionRequest } from './use-auth-form';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';
import { networkError } from '@/lib/api/api-errors.mjs';

// Compartilha apenas o estado de exibição nesta aba. As APIs continuam validando
// sessão e permissões a cada operação, sem cache de autorização no servidor.
const SESSION_RECHECK_MS = 30000;
let sessionResult, sessionError, checkedAt = 0, sharedRequest = null, sharedController;
let sessionVersion = 0, lastChangeEvent;

function invalidateSession(event) {
 if (lastChangeEvent === event) return;
 lastChangeEvent = event;
 sessionVersion++;
 sharedController?.abort();
 sharedRequest = null;
 sessionResult = undefined;
 sessionError = undefined;
 checkedAt = 0;
}

function readSharedSession() {
 if (sharedRequest) return sharedRequest;
 if (Date.now() - checkedAt < SESSION_RECHECK_MS) return sessionError ? Promise.reject(sessionError) : Promise.resolve(sessionResult);
 const version = sessionVersion;
 const controller = new AbortController();
 sharedController = controller;
 const task = (async () => {
  try {
   const response = await sessionFetch('/api/session/me', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
   const data = await readSessionResponse(response);
   if (version === sessionVersion) { sessionResult = data; sessionError = undefined; }
   return data;
  } catch (error) {
   const failure = error.name === 'TimeoutError' ? networkError(error) : error;
   if (version === sessionVersion) {
    sessionError = failure;
    if ([401, 403].includes(failure.status)) sessionResult = undefined;
   }
   throw failure;
  } finally {
   if (version === sessionVersion) checkedAt = Date.now();
   if (sharedRequest === task) { sharedRequest = null; sharedController = undefined; }
  }
 })();
 sharedRequest = task;
 return task;
}

export function useSession(initialUser = null) {
 const path=usePathname();const [user,setUser]=useState(initialUser),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 const exiting=useRef(false);
 useEffect(()=>{
  const abort=new AbortController();
  let version=0;
  const load=async event=>{
   if(event?.type==='cineastra-session')invalidateSession(event);
   const current=++version;
   try {
    const data=await readSharedSession();
    if(!abort.signal.aborted&&current===version){setUser(data.user||null);setMessage('');}
   } catch (error) {
    if(!abort.signal.aborted&&current===version){
     if([401,403].includes(error.status))setUser(null);
     setMessage(error.message || 'Não foi possível verificar a sessão. Tente atualizar a página.');
    }
   } finally {if(!abort.signal.aborted&&current===version)setLoading(false);}
  };
  load();window.addEventListener('cineastra-session',load);window.addEventListener('focus',load);
  // Desmontar um consumidor não cancela a consulta utilizada pelos demais.
  return()=>{abort.abort();window.removeEventListener('cineastra-session',load);window.removeEventListener('focus',load);};
 },[path]);
 const logout=async()=>{
  if(exiting.current)return;exiting.current=true;setPending(true);setMessage('');
  try{await sessionRequest('logout',{});setUser(null);window.dispatchEvent(new Event('cineastra-session'));window.location.replace('/auth/login');}
  catch(error){setMessage(error.message || 'Não foi possível sair. Tente novamente.');exiting.current=false;setPending(false);}
 };
 return {user,loading,message,pending,logout};
}
