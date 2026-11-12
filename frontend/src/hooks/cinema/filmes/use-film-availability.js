"use client";
import {useEffect,useState} from 'react';
import {publicGet} from '@/lib/api/public-api.mjs';

export function useFilmAvailability(filmId){
 const [revision,setRevision]=useState(0);
 const [state,setState]=useState(null);
 const key=`${filmId}:${revision}`;
 useEffect(()=>{
  const abort=new AbortController();
  publicGet(`/films/${filmId}/availability`,{signal:abort.signal})
   .then(data=>{if(!abort.signal.aborted)setState({key,items:data.locations,loading:false,error:null});})
   .catch(error=>{if(!abort.signal.aborted)setState({key,items:[],loading:false,error:error.message});});
  return()=>abort.abort();
 },[filmId,key]);
 return {...(state?.key===key?state:{items:[],loading:true,error:null}),refresh:()=>setRevision(value=>value+1)};
}
