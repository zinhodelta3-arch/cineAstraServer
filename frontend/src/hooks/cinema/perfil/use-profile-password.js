"use client";
import {useRef,useState} from 'react';
import {profileRequest} from './use-profile-resource';
export default function useProfilePassword(){
 const [open,setOpen]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false);
 const lock=useRef(false);
 const changeOpen=value=>{if(lock.current)return;setError('');setOpen(value);};
 const submit=async e=>{
  e.preventDefault();if(lock.current)return;
  const form=e.currentTarget,data=new FormData(form);
  if(data.get('password')!==data.get('confirm')){setError('As senhas precisam ser iguais.');return;}
  lock.current=true;setPending(true);setError('');
  try{
   await profileRequest('password','PATCH',{currentPassword:data.get('current'),password:data.get('password'),passwordConfirmation:data.get('confirm'),...(data.get('code')?{code:data.get('code')}:{})});
   form.reset();window.dispatchEvent(new Event('cineastra-session'));window.location.replace('/auth/login');
  }catch(e){setError(e.message);lock.current=false;setPending(false);}
 };
 return {open,error,pending,submit,changeOpen};
}
