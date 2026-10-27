"use client";
import { useEffect, useRef, useState } from 'react';
import { passwordValid } from '@/lib/auth/destination.mjs';
export async function sessionRequest(action,body,signal) {
 const response=await fetch(`/api/session/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body),signal});
 const data=await response.json();if(!response.ok)throw new Error(data.message||'Não foi possível concluir a operação.');return data;
}
export function useAuthForm({resetToken}={}) {
 const [form,setForm]=useState({login:'',password:'',confirmation:''});
 const [resetOpen,setResetOpen]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState(false),[user,setUser]=useState(null),[success,setSuccess]=useState(false);
 const active=useRef(null),busy=useRef(false);
 useEffect(()=>()=>active.current?.abort(),[]);
 const changeMode=value=>{if(busy.current)return;setResetOpen(value);setMessage('');setSuccess(false);setForm(f=>({...f,password:'',confirmation:''}));};
 const update=key=>event=>setForm(f=>({...f,[key]:event.target.value}));
 const submit=async event=>{
  event.preventDefault();if(busy.current)return;
  if(resetToken!==undefined&&(!/^[a-f0-9]{64}$/.test(resetToken)||!passwordValid(form.password,form.confirmation))){setMessage('Confira o link e use senhas iguais, com 12 caracteres ou mais, maiúscula, minúscula, número e símbolo (até 72 bytes).');return;}
  busy.current=true;setPending(true);setMessage('');setSuccess(false);const abort=new AbortController();active.current=abort;
  try{
   const action=resetToken!==undefined?'reset':resetOpen?'forgot':'login';
   const body=action==='reset'?{token:resetToken,password:form.password,passwordConfirmation:form.confirmation}:action==='forgot'?{email:form.login.trim()}:{email:form.login.trim(),password:form.password};
   const result=await sessionRequest(action,body,abort.signal);setForm(f=>({...f,password:'',confirmation:''}));
   if(action==='login'){
    setUser(result.user);window.dispatchEvent(new Event('cineastra-session'));
    if(result.destination){window.location.replace(result.destination);}
    else setMessage('Login realizado. A área do supervisor ainda não está disponível.');
   }else{setMessage(result.message);setSuccess(true);}
  }catch(e){if(!abort.signal.aborted)setMessage(e.message||'Falha de conexão. Tente novamente.');}
  finally{busy.current=false;if(!abort.signal.aborted)setPending(false);}
 };
 return {form,update,resetOpen,setResetOpen:changeMode,message,pending,user,success,handleSubmit:submit};
}
