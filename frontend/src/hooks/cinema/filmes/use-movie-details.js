"use client";
import {useEffect,useState} from 'react';
import {publicGet} from '@/lib/api/public-api.mjs';
import {cinemaMovie} from '@/lib/api/cinema-movies.mjs';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
export function useMovieDetails(id){
 const [revision,setRevision]=useState(0),[state,setState]=useState(null);
 const key=`${id}:${revision}`;
 useEffect(()=>{
  const abort=new AbortController();
  publicGet(`/films/${id}`,{signal:abort.signal}).then(film=>{if(!abort.signal.aborted)setState({key,movie:cinemaMovie(film)});}).catch(error=>{if(!abort.signal.aborted)setState({key,error:error.message});});
  return()=>abort.abort();
 },[id,key]);
 const genres=usePublicList(`/films/${id}/genres?limit=100`);
 const gallery=usePublicList(`/films/${id}/images?limit=20`);
 return {movie:state?.key===key?state.movie:null,error:state?.key===key?state.error:null,loading:state?.key!==key,genres,gallery,retry:()=>setRevision(v=>v+1)};
}
