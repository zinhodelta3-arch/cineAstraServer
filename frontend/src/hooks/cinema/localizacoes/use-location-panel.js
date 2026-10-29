"use client";
import {useState,useEffect,useRef} from 'react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicGet} from '@/lib/api/public-api.mjs';
import {cinemaLocation} from '@/lib/api/cinema-locations.mjs';
export function useLocationPanel(initial){
 const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
 const [revision,setRevision]=useState(0),[detail,setDetail]=useState(null);
 const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState('');
 const timer=useRef(null),key=`${initial.id}:${revision}`;
 useEffect(()=>{const abort=new AbortController();publicGet(`/locations/${initial.id}`,{signal:abort.signal}).then(row=>{if(!abort.signal.aborted)setDetail({key,loc:cinemaLocation(row)});}).catch(e=>{if(!abort.signal.aborted)setDetail({key,error:e.message});});return()=>abort.abort();},[initial.id,key]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const loc=detail?.key===key?detail.loc:null;
 const rooms=usePublicList(loc?`/locations/${loc.id}/rooms?limit=100`:null);
 const copy=async()=>{try{await navigator.clipboard.writeText(loc.fullAddress);setCopied(true);setCopyError('');clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2000);}catch{setCopyError('Não foi possível copiar. Selecione o endereço para copiá-lo.');}};
 return {loc,date,setDate,rooms,copied,copy,copyError,loading:detail?.key!==key,error:detail?.key===key?detail.error:null,retry:()=>setRevision(v=>v+1)};
}
