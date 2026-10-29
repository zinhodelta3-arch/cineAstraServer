"use client";
import {useEffect,useState} from 'react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicGet} from '@/lib/api/public-api.mjs';
export function useSessionTimetable(localId,date){
 const list=usePublicList(date?`/sessions?${new URLSearchParams({localId,date,limit:'20'})}`:null);
 const ids=[...new Set(list.items.map(s=>String(s.id_filme)))].sort().join(',');
 const [revision,setRevision]=useState(0),[films,setFilms]=useState({});
 const key=`${ids}:${revision}`;
 useEffect(()=>{if(!ids)return;const abort=new AbortController();Promise.all(ids.split(',').map(async id=>{try{return [id,await publicGet(`/films/${id}`,{signal:abort.signal})];}catch{return [id,null];}})).then(rows=>{if(!abort.signal.aborted)setFilms({key,items:Object.fromEntries(rows)});});return()=>abort.abort();},[ids,key]);
 return {list,films:films.key===key?films.items:{},filmsLoading:Boolean(ids)&&films.key!==key,filmsError:films.key===key&&Object.values(films.items).some(f=>!f),retryFilms:()=>setRevision(v=>v+1)};
}
