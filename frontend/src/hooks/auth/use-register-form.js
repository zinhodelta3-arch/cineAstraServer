"use client";
import {useState,useEffect,useRef} from 'react';
import {registrationDocuments} from '@/lib/auth/registration-documents.mjs';
import {passwordValid} from '@/lib/auth/destination.mjs';
import {sessionRequest} from './use-auth-form';
export function useRegisterForm(){
 const [form,setForm]=useState({name:'',email:'',cpf:'',dateOfBirth:'',password:'',confirmPassword:''});
 const [accepted,setAccepted]=useState(false),[message,setMessage]=useState(''),[pending,setPending]=useState(false),[success,setSuccess]=useState(false);
 const documents=registrationDocuments;
 const active=useRef(null),busy=useRef(false);
 useEffect(()=>()=>active.current?.abort(),[]);
 const update=key=>event=>{
  const raw=event.target.value;
  const value=key==='cpf'
   ? raw.replace(/\D/g,'').slice(0,11).replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3}\.\d{3})(\d)/,'$1.$2').replace(/(\d{3}\.\d{3}\.\d{3})(\d)/,'$1-$2')
   : raw;
  setForm(current=>({...current,[key]:value}));
 };
 const handleSubmit=async event=>{
  event.preventDefault();if(busy.current||success)return;
  if(!documents||!accepted){setMessage('Leia e aceite os termos e a política de privacidade.');return;}
  if(!passwordValid(form.password,form.confirmPassword)){setMessage('As senhas devem ser iguais e ter pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo; máximo de 72 bytes.');return;}
  busy.current=true;setPending(true);setMessage('');const abort=new AbortController();active.current=abort;
  try{const data=await sessionRequest('register',{name:form.name.trim(),email:form.email.trim(),cpf:form.cpf.replace(/[.\-\s]/g,''),dateOfBirth:form.dateOfBirth,password:form.password,passwordConfirmation:form.confirmPassword,documentsSource:'LOCAL_TEST_PDF',termsVersion:documents.terms.version,privacyVersion:documents.privacy.version,acceptTerms:true,acceptPrivacy:true},abort.signal);if(!abort.signal.aborted){setSuccess(true);setMessage(data.message);setForm(f=>({...f,password:'',confirmPassword:''}));}}
  catch(e){if(!abort.signal.aborted)setMessage(e.message||'Não foi possível criar sua conta.');}
  finally{busy.current=false;if(!abort.signal.aborted)setPending(false);}
 };
 return {form,accepted,setAccepted,update,handleSubmit,message,pending,success,documents,today:new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})};
}
