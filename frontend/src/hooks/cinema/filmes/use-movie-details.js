"use client";
import {useEffect,useState} from 'react';
import {publicGet} from '@/lib/api/public-api.mjs';
import {cinemaMovie} from '@/lib/api/cinema-movies.mjs';
export function useMovieDetails(id,{initialFilm=null}={}){
 const [revision,setRevision]=useState(0),[state,setState]=useState(null);
 const key=`${id}:${revision}`;
 const initial=revision===0&&initialFilm?initialFilm:null;
 useEffect(()=>{
  if(revision===0&&initialFilm)return;
  const abort=new AbortController();
  publicGet(`/films/${id}`,{signal:abort.signal}).then(film=>{if(!abort.signal.aborted)setState({key,film});}).catch(error=>{if(!abort.signal.aborted)setState({key,error:error.message});});
  return()=>abort.abort();
 },[id,key,initialFilm,revision]);
 const record=initial??(state?.key===key?state.film:null);
 return {movie:record?cinemaMovie(record):null,error:state?.key===key?state.error:null,loading:!initial&&state?.key!==key,
  genres:{items:Array.isArray(record?.generos)?record.generos:[],loading:false,error:null,cursor:null},
  retry:()=>setRevision(v=>v+1)};
}
