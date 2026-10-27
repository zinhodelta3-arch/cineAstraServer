"use client";
import {useState,useEffect,useRef} from 'react';
import {publicGet} from '@/lib/api/public-api.mjs';
import {passwordValid} from '@/lib/auth/destination.mjs';
import {sessionRequest} from './use-auth-form';
export function useRegisterForm(){
 const [form,setForm]=useState({name:'',email:'',cpf:'',dateOfBirth:'',password:'',confirmPassword:''});
 const [accepted,setAccepted]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState(false),[success,setSuccess]=useState(false);
 const [documents,setDocuments]=useState(null),[documentError,setDocumentError]=useState(''),[revision,setRevision]=useState(0);
 const active=useRef(null),busy=useRef(false);
 useEffect(()=>{const abort=new AbortController();async function load(){try{const [terms,privacy]=await Promise.all([publicGet('/content/terms',{signal:abort.signal}),publicGet('/content/privacy',{signal:abort.signal})]);if(!terms.version||!privacy.version||!terms.body?.text||!privacy.body?.text)throw new Error();if(!abort.signal.aborted){setDocuments({terms,privacy});setDocumentError('');}}catch{if(!abort.signal.aborted)setDocumentError('Não foi possível carregar os termos e a política de privacidade. Tente novamente.');}}load();return()=>abort.abort();},[revision]);
 useEffect(()=>()=>active.current?.abort(),[]);
 const update=key=>event=>setForm(current=>({...current,[key]:event.target.value}));
 const handleSubmit=async event=>{
  event.preventDefault();if(busy.current||success)return;
  if(!documents||!accepted){setMessage('Leia e aceite os termos e a política de privacidade.');return;}
  if(!passwordValid(form.password,form.confirmPassword)){setMessage('As senhas devem ser iguais e ter pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo; máximo de 72 bytes.');return;}
  busy.current=true;setPending(true);setMessage('');const abort=new AbortController();active.current=abort;
  try{const data=await sessionRequest('register',{name:form.name.trim(),email:form.email.trim(),cpf:form.cpf.replace(/[.\-\s]/g,''),dateOfBirth:form.dateOfBirth,password:form.password,passwordConfirmation:form.confirmPassword,termsVersion:documents.terms.version,privacyVersion:documents.privacy.version,acceptTerms:true,acceptPrivacy:true},abort.signal);if(!abort.signal.aborted){setSuccess(true);setMessage(data.message);setForm(f=>({...f,password:'',confirmPassword:''}));}}
  catch(e){if(!abort.signal.aborted)setMessage(e.message||'Não foi possível criar sua conta.');}
  finally{busy.current=false;if(!abort.signal.aborted)setPending(false);}
 };
 return {form,accepted,setAccepted,update,handleSubmit,message,pending,success,documents,documentError,retryDocuments:()=>setRevision(v=>v+1),today:new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})};
}
