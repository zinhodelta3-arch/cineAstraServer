"use client";
import Link from 'next/link';
import {ArrowLeft,CalendarDays,MapPin,Ticket} from 'lucide-react';
import ListStatus from '@/components/cinema/home/list-status';
const dateLabel=day=>new Date(`${day}T12:00:00Z`).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'});
export default function FilmProgram({film}){
 const local=film.locations.items.find(item=>String(item.id_local)===film.localId);
 return <section className="cf-program" aria-labelledby="cf-sessions-title">
  <div className="cf-program-head">
   <Link href="/cinema/filmes" className="cf-back inline-flex items-center gap-2 text-sm"><ArrowLeft size={15}/> Voltar aos filmes</Link>
   <div className="cf-section-label flex items-center gap-2"><Ticket size={15}/> PROGRAMAÇÃO</div>
   <h1 id="cf-sessions-title" className="cf-heading">Escolha sua sessão</h1>
   <p className="cf-showing">Consulte os horários e escolha onde assistir <strong>{film.movie.title}</strong>.</p>
   <label className="cf-field-label" htmlFor="cf-cinema">Cinema</label>
   <select id="cf-cinema" className="cf-native-select" value={film.localId} onChange={e=>film.changeLocal(e.target.value)}>{film.locations.items.map(item=><option key={item.id_local} value={item.id_local}>{item.nome}</option>)}</select>
   {local&&<p className="cf-address flex items-center gap-1.5"><MapPin size={13}/>{local.cidade}, {local.estado}</p>}
   <ListStatus list={film.locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas"/>
   <div className="cf-filters"><label className="cf-field-label" htmlFor="cf-language">Idioma</label><select id="cf-language" className="cf-native-select cf-language" value={film.language} onChange={e=>film.setLanguage(e.target.value)}><option value="Todos">Todos os idiomas</option><option value="DUBLADO">Dublado</option><option value="LEGENDADO">Legendado</option><option value="ORIGINAL">Original</option></select></div>
  </div>
  <div className="cf-session-scroll" aria-label="Lista de sessões">
   {film.day&&<><div className="cf-session-date flex items-center gap-2"><CalendarDays size={14}/>{dateLabel(film.day)}</div><div className="cf-session-summary"><span>Local selecionado</span><strong>{local?.nome}</strong></div>
    {film.visibleSessions.map(session=><article className="cf-session-group" key={session.id_sessao}><div className="cf-group-top"><div><div className="cf-room-line"><span className="cf-room-format">{film.rooms.items.find(room=>room.id_sala===session.id_sala)?.tipo||'Cinema'}</span><span>{session.idioma}</span></div><p className="cf-room-name">{film.rooms.items.find(room=>room.id_sala===session.id_sala)?.nome||'Sala a confirmar'}</p></div><div className="cf-prices"><span>Inteira: {Number(session.preco_inteira).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div></div><div className="cf-tickets"><Link href={`/cinema/sessao/assentos?sessionId=${session.id_sessao}`} className="cf-ticket" aria-label={`Escolher assentos para a sessão das ${session.horario_inicio.slice(0,5)}`}><span>{dateLabel(film.day)}</span><strong>{session.horario_inicio.slice(0,5)}</strong><small>Escolher assentos</small></Link></div></article>)}
    {!film.sessions.loading&&!film.sessions.error&&!film.visibleSessions.length&&<p className="cf-empty">Nenhum horário encontrado para este filme e filtro.</p>}
    <ListStatus list={film.rooms} empty="" more="Mais salas"/><ListStatus list={film.sessions} empty="" more="Mais sessões"/>
   </>}
  </div>
 </section>;
}
