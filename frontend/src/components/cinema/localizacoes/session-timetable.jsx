"use client";
import Link from 'next/link';
import {PosterImg} from './location-images';
import {AgeBadge} from './location-ui';
import ListStatus from '@/components/cinema/home/list-status';
import {publicAsset} from '@/lib/api/public-api.mjs';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {sessionAvailability,useSessionClock} from '../filmes/session-availability';
export default function Timetable({loc,date,rooms}){
 const list=usePublicList(`/sessions?${new URLSearchParams({localId:loc.id,date,limit:'20'})}`);
 const now=useSessionClock();
 return <div>
  <div className="space-y-3">{list.items.map(s=>{const room=rooms.items.find(r=>r.id_sala===s.id_sala);const availability=sessionAvailability(s,now);return <article key={s.id_sessao} className="grid gap-4 rounded-lg border border-border bg-background/40 p-4 sm:grid-cols-[1fr_auto]">
   <div className="flex min-w-0 items-center gap-3"><div className="h-[72px] w-12 shrink-0 overflow-hidden rounded-md bg-muted"><PosterImg src={publicAsset(s.imagem_filme)} title={s.titulo_filme||'Filme'}/></div><div className="min-w-0"><h4 className="f-title text-lg font-bold">{s.titulo_filme||`Filme #${s.id_filme}`}</h4><p className="mt-1 text-xs text-muted-foreground">{room?.nome||`Sala #${s.id_sala}`} · {s.idioma}</p>{s.classificacao_filme&&<div className="mt-2"><AgeBadge age={s.classificacao_filme}/></div>}</div></div>
   <div className="self-center"><p className="text-lg font-bold text-primary">{s.horario_inicio.slice(0,5)} — {s.horario_fim.slice(0,5)}</p>{s.data_fim!==s.data&&<p className="text-xs">Término em {s.data_fim.split('-').reverse().join('/')}</p>}<p className="mt-1 text-sm">{Number(s.preco_inteira).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · inteira</p><p className="mt-1 text-xs text-muted-foreground">{({AGENDADA:'Agendada',EM_CARTAZ:'Em andamento',ENCERRADA:'Encerrada',CANCELADA:'Cancelada'})[s.status]||'Status a confirmar'}</p></div>
   <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 sm:col-span-2">
    <span className={availability.low || availability.soon ? 'text-sm font-semibold text-primary' : 'text-sm text-muted-foreground'}>{availability.label}</span>
    {availability.bookable && <Link href={`/cinema/sessao/assentos?sessionId=${s.id_sessao}`} className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">Escolher assentos</Link>}
   </div>
  </article>;})}</div>
  <ListStatus list={list} empty="Nenhuma sessão disponível para esta data." more="Carregar mais sessões"/>
 </div>;
}
