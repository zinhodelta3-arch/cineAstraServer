"use client";
import {ChevronLeft,ChevronRight,CalendarDays} from 'lucide-react';
import {useHorizontalScroll} from '@/hooks/use-horizontal-scroll';
const dayName=day=>new Date(`${day}T12:00:00Z`).toLocaleDateString('pt-BR',{weekday:'long',timeZone:'UTC'});
const shortDate=day=>`${day.slice(8,10)}/${new Date(`${day}T12:00:00Z`).toLocaleDateString('pt-BR',{month:'short',timeZone:'UTC'}).replace('.','')}`;
export default function FilmDates({film}){
 const {listRef,scroll,back,next}=useHorizontalScroll(film.days.items.length);
 const selectedLocal=film.locations.items.find(local=>String(local.id_local)===film.localId);
 return <section className="cf-date-band" aria-label="Datas das sessões"><div className="cf-date-head"><div><h2>Horários</h2><p className="cf-date-kicker"><CalendarDays size={14} aria-hidden="true"/> {selectedLocal?.nome||film.availability.items.find(item=>item.localId===film.localId)?.name||'Programação do cinema'}</p></div>{(back||next)&&<div className="cf-date-arrows"><button type="button" disabled={!back} aria-label="Datas anteriores" onClick={()=>scroll(-1)}><ChevronLeft size={18}/></button><button type="button" disabled={!next} aria-label="Próximas datas" onClick={()=>scroll(1)}><ChevronRight size={18}/></button></div>}</div>
  {film.days.loading&&<p role="status">Carregando dias disponíveis…</p>}
  {film.days.error&&<p role="alert">{film.days.error}</p>}
  {film.localId&&!film.days.loading&&!film.days.error&&!film.days.items.length&&<p className="cf-empty">Este cinema ainda não publicou sessões para o filme. Consulte a disponibilidade em outros cinemas.</p>}
  <div ref={listRef} className="cf-date-list" role="group" aria-label="Escolha o dia">{film.days.items.map(day=><button key={day} type="button" className="cf-date-ticket" aria-pressed={film.day===day} onClick={()=>film.setDay(day)} aria-label={`${dayName(day)}, ${shortDate(day)}`}><span>{dayName(day)}</span><strong>{shortDate(day)}</strong></button>)}</div>
 </section>;
}
