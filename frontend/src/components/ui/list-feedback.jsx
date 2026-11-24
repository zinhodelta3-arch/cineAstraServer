'use client';

import { useEffect, useState } from 'react';

export function ListSkeleton({ label = 'Carregando registros…' }) {
  return <div className="min-h-36 space-y-3 px-5 py-6" role="status">
    <span className="text-sm text-muted-foreground">{label}</span>
    {[0,1,2].map(row=><div key={row} aria-hidden="true" className="h-8 rounded-md bg-muted motion-safe:animate-pulse" />)}
  </div>;
}

export function OperationFeedback({ pending, error, success, toast = false, className = '' }) {
  const [dismissed, setDismissed] = useState(null);
  const message = pending ? 'Processando…' : error || success;
  const floating = toast && !pending && !error;
  useEffect(()=>{
    setDismissed(null);
    if(!floating||!message)return;
    const timer=setTimeout(()=>setDismissed(message),4500);
    return()=>clearTimeout(timer);
  },[floating,message]);
  if (!message || floating&&dismissed===message) return null;
  return <p role={!pending&&error?'alert':'status'} aria-live={!pending&&error?'assertive':'polite'}
    className={`rounded-lg border border-border bg-card px-4 py-3 text-sm ${floating?'pointer-events-none fixed right-4 top-24 z-[150] max-w-[calc(100vw-2rem)] shadow-md':''} ${!pending&&error?'text-destructive':'text-foreground'} ${className}`}>
    {message}
  </p>;
}
