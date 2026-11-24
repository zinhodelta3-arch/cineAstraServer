'use client';

import {useEffect,useState} from 'react';

export default function useSeatLayout(path,request,revision=0) {
  const [version,setVersion]=useState(0);
  const key=`${path}:${revision}:${version}`;
  const [state,setState]=useState(null);
  useEffect(()=>{
    if(!path)return;
    const abort=new AbortController();
    request(path,{signal:abort.signal}).then(data=>{
      if(!Array.isArray(data?.seats))throw new Error('Mapa de assentos indisponível.');
      if(!abort.signal.aborted)setState({key,data});
    }).catch(error=>{if(!abort.signal.aborted)setState({key,error:error.message});});
    return ()=>abort.abort();
  },[path,request,key]);
  const current=state?.key===key?state:null;
  return {data:current?.data,error:current?.error,loading:Boolean(path&&!current),reload:()=>setVersion(value=>value+1)};
}
