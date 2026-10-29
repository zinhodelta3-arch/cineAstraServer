"use client";
import {MapPin,Navigation,Copy,Check} from 'lucide-react';
import {Button} from './location-ui';
import Timetable from './session-timetable';
import ListStatus from '@/components/cinema/home/list-status';
import {useLocationPanel} from '@/hooks/cinema/localizacoes/use-location-panel';
export default function LocationPanel({loc:initial}){
 const panel=useLocationPanel(initial),{loc,date,setDate,rooms,copied,copy,copyError,loading,error,retry}=panel;
 if(loading)return <p role="status" className="p-6">Carregando cinema…</p>;
 if(error)return <div role="alert" className="rounded-xl border border-border bg-card p-6"><p>{error}</p><Button onClick={retry}>Tentar novamente</Button></div>;
 return <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
  <div className="bulbs" aria-hidden="true"/>
  <div className="p-5 md:p-8"><h2 className="f-display text-3xl md:text-5xl font-black text-foreground">{loc.name}</h2>
   <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto]">
    <div><h3 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary"/>Endereço</h3><p className="f-title mt-2 text-xl">{loc.street}</p><p className="mt-1 text-sm text-muted-foreground">{loc.district}{loc.cep?` · CEP ${loc.cep}`:''}</p>{loc.phone&&<p className="mt-3 text-sm">Telefone: {loc.phone}</p>}</div>
    {loc.fullAddress&&<div className="flex flex-wrap items-start gap-2"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name}, ${loc.fullAddress}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"><Navigation className="mr-2 size-4"/>Como chegar</a><Button variant="outline" onClick={copy}>{copied?<Check className="mr-2 size-4"/>:<Copy className="mr-2 size-4"/>}{copied?'Endereço copiado':'Copiar endereço'}</Button></div>}
   </div>{copyError&&<p role="status" className="mt-3 text-sm">{copyError}</p>}
   <section className="mt-8 border-t border-dashed border-border pt-6" aria-label="Salas do cinema"><h3 className="f-title text-xl font-bold">Salas</h3><ul className="mt-3 flex flex-wrap gap-2">{rooms.items.map(r=><li key={r.id_sala} className="rounded-lg border border-border px-3 py-2 text-sm">{r.nome} · {r.tipo} · {r.capacidade} lugares</li>)}</ul><ListStatus list={rooms} empty="Nenhuma sala disponível." more="Carregar mais salas"/></section>
   <section className="mt-6 border-t border-dashed border-border pt-6" aria-label="Programação do cinema"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h3 className="f-display text-3xl font-black uppercase">Programação</h3><label className="text-sm">Data da sessão (UTC)<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 block rounded-lg border border-border bg-background p-2"/></label></div><p className="mb-4 text-xs text-muted-foreground">Horários em UTC. Valores de inteira cadastrados; descontos e disponibilidade são confirmados na compra.</p>{date?<Timetable key={`${loc.id}:${date}`} loc={loc} date={date} rooms={rooms}/>:<p>Selecione uma data para consultar as sessões.</p>}</section>
  </div><div className="perf !rounded-none" aria-hidden="true"/>
 </div>;
}
