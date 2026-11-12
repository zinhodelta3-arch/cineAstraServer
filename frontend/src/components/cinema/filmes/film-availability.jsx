"use client";
import {MapPin} from 'lucide-react';
export default function FilmAvailability({film}){
 const byLocal=new Map(film.availability.items.map(item=>[item.localId,item]));
 const active=film.availability.items.filter(item=>item.openSessions>0).length;
 return <section className="cf-availability" aria-labelledby="cf-availability-title">
  <div className="cf-availability-heading"><div><h3 id="cf-availability-title">Disponibilidade por localização</h3><p>Veja em quais cinemas este filme tem sessões futuras.</p></div><span className="cf-availability-count">{active} de {film.locations.items.length}</span></div>
  {film.availability.loading&&<p role="status">Carregando disponibilidade…</p>}
  {film.availability.error&&<p role="alert">{film.availability.error}</p>}
  <div className="cf-availability-list">{film.locations.items.map(local=>{const info=byLocal.get(String(local.id_local));return <button type="button" key={local.id_local} className="cf-location-card" aria-pressed={String(local.id_local)===film.localId} onClick={()=>{film.changeLocal(String(local.id_local));document.getElementById('cf-sessions-title')?.scrollIntoView({behavior:'smooth',block:'start'});}}><span><span className="cf-location-name"><MapPin size={16}/>{local.nome}</span>{info?.popular&&<span className="cf-location-detail font-semibold text-primary">Mais procurado</span>}<span className="cf-location-address">{local.cidade}, {local.estado}</span>{info?.formats.length>0&&<span className="cf-location-detail">Formatos: {info.formats.join(' · ')}</span>}</span><span className="cf-location-status"><strong>{film.availability.loading||film.availability.error?'—':info?.openSessions?'Disponível':info?'Sem lugares':'Sem sessões'}</strong><small>{info?`${info.openSessions} de ${info.sessions} com lugares`:'Nenhum horário'}</small></span></button>;})}</div>
  <p className="cf-availability-note">O destaque considera assentos vendidos nas próximas sessões deste filme. A disponibilidade é confirmada na compra.</p>
 </section>;
}
