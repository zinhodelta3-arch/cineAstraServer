"use client";
import Link from 'next/link';
import {MapPin,Navigation,Copy,Check,ExternalLink} from 'lucide-react';
import {Button} from './location-ui';
import Timetable from './session-timetable';
import ListStatus from '@/components/cinema/home/list-status';
import {useLocationPanel} from '@/hooks/cinema/localizacoes/use-location-panel';
import {VenueImg} from './location-images';
export default function LocationPanel({loc:initial,standalone=false}){
 const panel=useLocationPanel(initial,standalone),{loc,date,setDate,rooms,copied,copy,copyError,loading,error,retry}=panel;
 if(loading)return <p role="status" className="p-6">Carregando cinema…</p>;
 if(error)return <div role="alert" className="rounded-xl border border-border bg-card p-6"><p>{error}</p><Button onClick={retry}>Tentar novamente</Button></div>;
 const address=encodeURIComponent(loc.fullAddress ?? "");
 const directions=`https://www.google.com/maps/dir/?api=1&destination=${address}`;
 const mapKey=process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
 const map=mapKey?`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapKey)}&q=${address}`:`https://maps.google.com/maps?q=${address}&output=embed`;
 return <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
  <div className="bulbs" aria-hidden="true"/>
  <div className="relative aspect-[2/1] max-h-80 overflow-hidden">
    <VenueImg src={loc.image || "/parcerias/sala-cinema.jpg"} kind="marquee" alt={loc.image?`Foto de ${loc.name}`:""}/>
    {!loc.image&&<span className="absolute bottom-3 right-3 rounded bg-background px-2 py-1 text-xs text-foreground">Imagem ilustrativa</span>}
  </div>
  <div className="p-5 md:p-8"><h2 className="f-display text-3xl md:text-5xl font-black text-foreground">{loc.name}</h2>
   <p className="mt-2 text-sm text-muted-foreground">{[loc.type,loc.eventCapacity && `Eventos para até ${loc.eventCapacity.toLocaleString('pt-BR')} pessoas`,loc.eventSeating].filter(Boolean).join(' · ')}</p>
   <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto]">
    <div><h3 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary"/>Endereço</h3><p className="f-title mt-2 text-xl">{loc.street}</p><p className="mt-1 text-sm text-muted-foreground">{loc.district}{loc.cep?` · CEP ${loc.cep}`:''}</p>{loc.phone&&<p className="mt-3 text-sm">Telefone: {loc.phone}</p>}</div>
    {loc.fullAddress&&<div className="flex flex-wrap items-start gap-2">{!standalone&&<Link href={`/cinema/localizacoes/${encodeURIComponent(loc.slug??loc.id)}#como-chegar`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"><Navigation size={16} aria-hidden="true" /> Como chegar</Link>}<Button variant="outline" onClick={copy}>{copied?<Check className="mr-2 size-4"/>:<Copy className="mr-2 size-4"/>}{copied?'Endereço copiado':'Copiar endereço'}</Button></div>}
   </div>{copyError&&<p role="status" className="mt-3 text-sm">{copyError}</p>}
   {standalone&&loc.fullAddress&&<section id="como-chegar" className="mt-7 scroll-mt-24 space-y-3" aria-labelledby="location-map-title">
    <h3 id="location-map-title" className="f-title text-xl font-bold">Como chegar</h3>
    <p className="text-sm text-muted-foreground">O mapa mostra o endereço cadastrado. A rota abre o Google Maps em outra aba.</p>
    <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">Abrir rota no Google Maps <ExternalLink size={16} aria-hidden="true"/><span className="sr-only"> em nova aba</span></a>
    <iframe title={`Mapa do endereço de ${loc.name}`} src={map} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="h-80 w-full rounded-xl border border-border sm:h-96"/>
   </section>}
   <section className="mt-8 border-t border-dashed border-border pt-6" aria-label="Salas do cinema"><h3 className="f-title text-xl font-bold">Salas</h3><ul className="mt-3 flex flex-wrap gap-2">{rooms.items.map(r=><li key={r.id_sala} className="rounded-lg border border-border px-3 py-2 text-sm">{r.nome} · {r.tipo} · {r.capacidade} lugares</li>)}</ul><ListStatus list={rooms} empty="Nenhuma sala disponível." more="Carregar mais salas"/></section>
   <section className="mt-6 border-t border-dashed border-border pt-6" aria-label="Programação do cinema"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h3 className="f-display text-3xl font-black uppercase">Programação</h3><label className="text-sm">Data da sessão (UTC)<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 block rounded-lg border border-border bg-background p-2"/></label></div><p className="mb-4 text-xs text-muted-foreground">Horários em UTC. Valores de inteira cadastrados; descontos e disponibilidade são confirmados na compra.</p>{date?<Timetable key={`${loc.id}:${date}`} loc={loc} date={date} rooms={rooms}/>:<p>Selecione uma data para consultar as sessões.</p>}</section>
  </div><div className="perf !rounded-none" aria-hidden="true"/>
 </div>;
}
