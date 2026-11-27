"use client";
import {useEffect,useState} from 'react';
import {useFilmAvailability} from './use-film-availability';
import {useMovieDetails} from './use-movie-details';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {publicGet} from '@/lib/api/public-api.mjs';
import {useCinemaLocation} from '@/components/providers/cinema-location-provider';
export function useFilmPage(id,initialFilm){
 const {ready,location:preferredCinema}=useCinemaLocation();
 const details=useMovieDetails(id,{initialFilm});
 const locations=usePublicList('/locations?limit=20');
 const [chosenLocalId,setLocalId]=useState('');
 const availability=useFilmAvailability(id);
 const firstOpen=availability.items.find(item=>item.openSessions>0);
 const localId=ready ? chosenLocalId||preferredCinema?.id_local||(!availability.loading ? firstOpen?.localId||String(locations.items[0]?.id_local||'') : '') : '';
 const [selectedDay,setSelectedDay]=useState(null);
 const [days,setDays]=useState({key:null,items:[],loading:false,error:null});
 const [daysRevision, refreshDays]=useState(0);
 const currentDays=days.key===localId?days:{items:[],loading:Boolean(localId),error:null};
 const nextDay=firstOpen?.localId===localId && currentDays.items.includes(firstOpen.nextDate) ? firstOpen.nextDate : currentDays.items[0];
 const day=(selectedDay?.localId===localId ? selectedDay.value : '')||nextDay||'';
 const setDay=value=>setSelectedDay({localId,value});

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
 },[id,localId,daysRevision]);
 const visibleSessions=sessions.items.filter(s=>String(s.id_filme)===String(id)&&new Date(`${s.data.slice(0,10)}T${s.horario_inicio}Z`)>new Date()&&(language==='Todos'||s.idioma===language));
 const visibleLocations=preferredCinema&&!locations.items.some(row=>String(row.id_local)===preferredCinema.id_local)
  ? {...locations,items:[preferredCinema,...locations.items]} : locations;
 return {...details,locations:visibleLocations,localId,day,days:currentDays,availability,rooms,sessions,visibleSessions,language,setLanguage,setDay,changeLocal:(id,date='')=>{setLocalId(id);setSelectedDay({localId:id,value:date});setLanguage('Todos');},refreshAvailability:()=>{refreshDays(value=>value+1);availability.refresh();sessions.retry();}};
}
