"use client";
import {useEffect,useState} from 'react';
import {useFilmAvailability} from './use-film-availability';
import {useMovieDetails} from './use-movie-details';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicGet} from '@/lib/api/public-api.mjs';
export function useFilmPage(id){
 const details=useMovieDetails(id);
 const locations=usePublicList('/locations?limit=100');
 const [chosenLocalId,setLocalId]=useState('');
 const availability=useFilmAvailability(id);
 const firstOpen=availability.items.find(item=>item.openSessions>0);
 const localId=chosenLocalId||(!availability.loading ? firstOpen?.localId||String(locations.items[0]?.id_local||'') : '');
 const [day,setDay]=useState('');
 const [days,setDays]=useState({key:null,items:[],loading:false,error:null});

 const [language,setLanguage]=useState('Todos');
 const rooms=usePublicList(localId?`/locations/${localId}/rooms?limit=100`:null);
 const sessions=usePublicList(localId&&day?`/sessions?filmId=${id}&localId=${localId}&date=${day}&limit=100`:null);
 useEffect(()=>{
  if(!localId)return;
  const abort=new AbortController();
  publicGet(`/films/${id}/available-days?localId=${localId}`,{signal:abort.signal})
   .then(data=>{if(!abort.signal.aborted)setDays({key:localId,items:data.days,loading:false,error:null});})
   .catch(error=>{if(!abort.signal.aborted)setDays({key:localId,items:[],loading:false,error:error.message});});
  return()=>abort.abort();
 },[id,localId]);
 useEffect(()=>{if(days.key===localId&&!day&&days.items.length)setDay(firstOpen?.localId===localId && days.items.includes(firstOpen.nextDate) ? firstOpen.nextDate : days.items[0]);},[days,localId,day,firstOpen]);
 const currentDays=days.key===localId?days:{items:[],loading:Boolean(localId),error:null};
 const visibleSessions=sessions.items.filter(s=>String(s.id_filme)===String(id)&&new Date(`${s.data.slice(0,10)}T${s.horario_inicio}Z`)>new Date()&&(language==='Todos'||s.idioma===language));
 return {...details,locations,localId,day,days:currentDays,availability,rooms,sessions,visibleSessions,language,setLanguage,setDay,changeLocal:(id,date='')=>{setLocalId(id);setDay(date);setLanguage('Todos');},refreshAvailability:()=>{setLocalId(localId);availability.refresh();sessions.retry();}};
}
