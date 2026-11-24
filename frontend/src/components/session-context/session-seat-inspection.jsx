'use client';

import {useMemo,useState} from 'react';
import {Armchair,Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import SeatMap from '@/components/cinema/assentos/seat-map';
import {accessibleSeat,seatStatus,seatType} from '@/components/cinema/assentos/seat-layout.mjs';
import useSeatLayout from '@/hooks/use-seat-layout';

const normalize=text=>String(text??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR').trim();

function SeatInspection({sessionId,request}) {
  const map=useSeatLayout(`sessions/${sessionId}/seat-map`,request);
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState('');
  const seats=useMemo(()=>(map.data?.seats??[]).map(row=>({...row,id:row.seatId,accessible:accessibleSeat(row.type)})),[map.data]);
  const item=seats.find(seat=>seat.id===selected);
  const query=normalize(search);
  const matches=query?seats.filter(seat=>normalize(`${seat.row}${seat.number}`).includes(query)||
    normalize(seat.customerName).includes(query)||String(seat.orderId??'')===query.replace(/^#/,'')).slice(0,12):[];
  const summary=Object.keys(seatStatus).map(status=>({
    status,count:seats.filter(seat=>seat.availability===status).length
  }));

  if(map.loading)return <p role="status" className="p-4 text-sm">Consultando a ocupação…</p>;
  if(map.error)return <div role="alert" className="space-y-3 p-4"><p>{map.error}</p><Button variant="outline" onClick={map.reload}>Tentar novamente</Button></div>;
  return <div className="space-y-4 p-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <label className="grid min-w-0 gap-1 text-sm font-semibold">Localizar lugar ou cliente
        <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Ex.: A12, nome ou pedido" value={search} onChange={event=>setSearch(event.target.value)}
            maxLength={150} className="min-h-10 min-w-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </span>
      </label>
      <Button type="button" variant="outline" onClick={map.reload}>Atualizar ocupação</Button>
    </div>
    {query&&(matches.length?<ul className="flex flex-wrap gap-2" aria-label="Resultados da busca">{matches.map(seat=><li key={seat.id}>
      <Button type="button" variant="outline" onClick={()=>setSelected(seat.id)}>{seat.row}{seat.number}{seat.customerName&&` · ${seat.customerName}`}</Button>
    </li>)}</ul>:<p className="text-sm text-muted-foreground" role="status">Nenhum lugar corresponde à busca.</p>)}
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Ocupação da sessão">{summary.map(({status,count})=><li key={status}>{seatStatus[status]} <strong>{count}</strong></li>)}</ul>
    {item&&<div className="rounded-lg border border-border bg-background p-3 text-sm" aria-live="polite">
      <strong>{item.row}{item.number} · {seatStatus[item.availability]} · {seatType[item.type]}</strong>
      {item.customerName&&<p>Cliente {item.customerName}</p>}
      {item.orderId&&<p>Pedido #{item.orderId}{item.orderStatus&&` · ${item.orderStatus.replaceAll('_',' ').toLowerCase()}`}</p>}
      {item.reservedUntil&&<p>Reserva até {new Date(item.reservedUntil).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p>}
    </div>}
    <SeatMap seats={seats} selectedSeat={selected} onSeatSelect={setSelected} />
  </div>;
}

export default function SessionSeatInspection({sessionId,request,initiallyOpen=false}) {
  const [open,setOpen]=useState(initiallyOpen);
  return <section className="min-w-0 rounded-xl border border-border bg-card" aria-label="Ocupação dos assentos da sessão">
    <button type="button" className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring"
      aria-expanded={open} onClick={()=>setOpen(value=>!value)}><Armchair size={17} aria-hidden="true" />{open?'Recolher mapa de assentos':'Consultar mapa de assentos'}</button>
    {open&&<SeatInspection key={sessionId} sessionId={sessionId} request={request} />}
  </section>;
}
