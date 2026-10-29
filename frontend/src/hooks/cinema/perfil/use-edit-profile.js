"use client";
import {useRef,useState} from 'react';
export default function useEditProfile(profile,onSave){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState({name:profile.name,phone:profile.phone||''}),[error,setError]=useState(''),[pending,setPending]=useState(false);
 const lock=useRef(false);
 const change=(field,value)=>setDraft(s=>({...s,[field]:value}));
 const changeOpen=value=>{if(lock.current)return;if(value){setDraft({name:profile.name,phone:profile.phone||''});setError('');}setOpen(value);};
 const submit=async e=>{
  e.preventDefault();if(lock.current)return;
  lock.current=true;setPending(true);setError('');
  try{await onSave({name:draft.name.trim(),phone:draft.phone.trim()||null});setOpen(false);}
  catch(e){setError(e.message);}
  finally{lock.current=false;setPending(false);}
 };
 return {open,draft,error,pending,change,changeOpen,submit};
}
