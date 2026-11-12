"use client";
import { createContext, createElement, useContext, useEffect, useRef, useState } from 'react';
import { sessionRequest } from './use-auth-form';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';
import { networkError } from '@/lib/api/api-errors.mjs';
import { notifySessionChange, SESSION_CHANGE_EVENT, SESSION_CHANGE_KEY } from '@/lib/auth/session-events.mjs';

// Compartilha apenas o estado de exibição nesta aba. As APIs continuam validando
// sessão e permissões a cada operação, sem cache de autorização no servidor.
const SESSION_RECHECK_MS = 30000;
const SessionContext = createContext(null);
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

function useSessionState(initialUser, enabled) {
 const seeded=initialUser!==undefined;
 const [user,setUser]=useState(initialUser??null),[loading,setLoading]=useState(!seeded),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
 const exiting=useRef(false);
 useEffect(()=>{
  if(!enabled)return;
  const abort=new AbortController();
  let version=0;
  let lastCheck=seeded?Date.now():0;
  const load=async event=>{
   if(event?.type==='storage'&&event.key!==SESSION_CHANGE_KEY)return;
   if(event?.type===SESSION_CHANGE_EVENT||event?.type==='storage')invalidateSession(event);
   else if(Date.now()-lastCheck<SESSION_RECHECK_MS)return;
   lastCheck=Date.now();
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
  if(!seeded)load();
  window.addEventListener(SESSION_CHANGE_EVENT,load);
  window.addEventListener('storage',load);
  window.addEventListener('focus',load);
  // Desmontar um consumidor não cancela a consulta utilizada pelos demais.
  return()=>{abort.abort();window.removeEventListener(SESSION_CHANGE_EVENT,load);window.removeEventListener('storage',load);window.removeEventListener('focus',load);};
 },[enabled,seeded]);
 const logout=async()=>{
  if(exiting.current)return;exiting.current=true;setPending(true);setMessage('');
  try{await sessionRequest('logout',{});setUser(null);notifySessionChange({local:false});window.location.replace('/auth/login');}
  catch(error){setMessage(error.message || 'Não foi possível sair. Tente novamente.');exiting.current=false;setPending(false);}
 };
 return {user,loading,message,pending,logout};
}

export function SessionProvider({initialUser,children}) {
 const session=useSessionState(initialUser,true);
 return createElement(SessionContext.Provider,{value:session},children);
}

export function useSession() {
 const session=useContext(SessionContext);
 const standalone=useSessionState(undefined,!session);
 return session??standalone;
}
