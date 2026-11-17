"use client";
import {useEffect,useRef,useState} from 'react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {useSession} from '@/hooks/auth/use-session';
import {publicGet,publicAsset,safeLink} from '@/lib/api/public-api.mjs';
import { sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
import {validateExperienceInquiry} from '@/lib/api/experience-inquiry.mjs';
const adapt=e=>({...e,imageUrl:publicAsset(e.imageUrl),targetUrl:safeLink(e.targetUrl),details:e.details||[]});
const emptyForm = { date: '', time: '', guests: '', details: '', preferences: '' };
export default function useCinemaExperiences(){
 const list=usePublicList('/experiences?limit=12'),session=useSession();
 const [selectedExperience,setSelected]=useState(''),[revision,setRevision]=useState(0),[detail,setDetail]=useState(null);
 const [form,setForm]=useState(emptyForm),[pending,setPending]=useState(false),[message,setMessage]=useState(''),[sent,setSent]=useState(null);
 const busy=useRef(false),active=useRef(null),key=`${selectedExperience}:${revision}`;
 const catalogItems = list.items;
 useEffect(() => {
  if (!catalogItems.length) return;
  const hash = window.location.hash.slice(1);
  if (!/^experiencia-[1-9]\d*$/.test(hash)) return;
  const card = document.getElementById(hash);
  card?.scrollIntoView({ block: 'start' });
  card?.focus({ preventScroll: true });
 }, [catalogItems]);
 useEffect(()=>()=>active.current?.abort(),[]);
 useEffect(()=>{if(!selectedExperience)return;const abort=new AbortController();publicGet(`/experiences/${selectedExperience}`,{signal:abort.signal}).then(e=>{if(!abort.signal.aborted)setDetail({key,experience:adapt(e)});}).catch(e=>{if(!abort.signal.aborted)setDetail({key,error:e.message});});return()=>abort.abort();},[selectedExperience,key]);
 const experience=detail?.key===key?detail.experience:null;
 const scroll=id=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 const chooseExperience=id=>{if(busy.current)return;setSelected(id);setSent(null);setMessage('');scroll('reservar');};
 const submitInquiry=async event=>{event.preventDefault();if(busy.current||sent||!experience)return;
 const body=validateExperienceInquiry({experienceId:selectedExperience,...form,guests:Number(form.guests)});
 if(!body){setMessage('Confira a data, a quantidade e escreva pelo menos 10 caracteres sobre o evento.');return;}
 if(session.user?.role!=='CLIENTE'){setMessage('Entre com uma conta de cliente para enviar.');return;}
 busy.current=true;setPending(true);setMessage('');const abort=new AbortController();active.current=abort;
 try{const response=await sessionFetch('/api/experiences/inquiry',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal});const data=await readSessionResponse(response);if(!abort.signal.aborted)setSent(data);}
 catch(e){if(!abort.signal.aborted)setMessage(e.message);}finally{busy.current=false;if(!abort.signal.aborted)setPending(false);}};
 const resetInquiry=()=>{setSent(null);setMessage('');setForm(emptyForm);};
 return {resetInquiry,list,experiences:list.items.map(adapt),session,selectedExperience,experience,detailLoading:Boolean(selectedExperience)&&detail?.key!==key,detailError:detail?.key===key?detail.error:null,retryDetail:()=>setRevision(v=>v+1),chooseExperience,showExperiences:()=>scroll('experiencias'),changeExperience:e=>chooseExperience(e.target.value),form,update:key=>e=>setForm(f=>({...f,[key]:e.target.value})),pending,message,sent,submitInquiry,minimumDate:new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})};
}
