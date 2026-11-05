'use client';

import { useEffect, useRef, useState } from 'react';
import { readSessionResponse } from '@/lib/auth/session-response.mjs';

export async function pricingRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`/api/admin/pricing/${path}`, {
    method, cache: 'no-store', credentials: 'same-origin', signal,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body)
  });
  if (response.status === 204) return null;
  if (method === 'GET' && ['parameters', 'promotions', 'coupons'].includes(path) && response.ok) {
    let data;
    try { data = await response.json(); }
    catch { throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`); }
    if (!Array.isArray(data)) throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`);
    return data;
  }
  return readSessionResponse(response);
}

export function usePricingList(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, items: [], nextCursor: null, loading: false, loadingMore: false, error: null });
  const generation = useRef(0);
  const controller = useRef(null), busy = useRef(false);
  const key = `${path}:${revision}`;
  useEffect(() => {
    const abort = new AbortController(), current = ++generation.current;
    controller.current=abort;busy.current=true;
    setState({ key, items: [], nextCursor: null, loading: true, loadingMore: false, error: null });
    pricingRequest(path, { signal: abort.signal }).then(data => {
      const items=Array.isArray(data)?data:data.items;
      if (!Array.isArray(items)) throw new Error('A lista retornou dados inválidos.');
      if (!abort.signal.aborted && current === generation.current) setState({ key, items, nextCursor: data.pagination?.nextCursor??null, loading: false, loadingMore: false, error: null });
    }).catch(error => {
      if (!abort.signal.aborted && current === generation.current) setState({ key, items: [], nextCursor: null, loading: false, loadingMore: false, error: error.message });
    }).finally(()=>{if(!abort.signal.aborted&&current===generation.current)busy.current=false;});
    return () => abort.abort();
  }, [key, path]);
  const visible = state.key === key ? state : { key, items: [], nextCursor: null, loading: true, loadingMore: false, error: null };
  async function loadMore(){
    if(busy.current||!visible.nextCursor||state.key!==key)return;
    const abort=controller.current,current=generation.current,cursor=visible.nextCursor;
    busy.current=true;setState(value=>({...value,loadingMore:true,error:null}));
    try{
      const data=await pricingRequest(`${path}${path.includes('?')?'&':'?'}cursor=${encodeURIComponent(cursor)}`,{signal:abort.signal});
      if(!Array.isArray(data.items)||!data.pagination||data.pagination.nextCursor===cursor)throw new Error('Paginação inválida. Tente novamente.');
      if(!abort.signal.aborted&&current===generation.current)setState(value=>({...value,items:[...value.items,...data.items],nextCursor:data.pagination.nextCursor,loadingMore:false}));
    }catch(error){if(!abort.signal.aborted&&current===generation.current)setState(value=>({...value,loadingMore:false,error:error.message}));}
    finally{if(!abort.signal.aborted&&current===generation.current)busy.current=false;}
  }
  return { ...visible, loadMore, reload: () => setRevision(value => value + 1) };
}
