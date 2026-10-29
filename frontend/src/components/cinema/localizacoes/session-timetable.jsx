"use client";
import {PosterImg} from './location-images';
import {AgeBadge,Button} from './location-ui';
import ListStatus from '@/components/cinema/home/list-status';
import {publicAsset} from '@/lib/api/public-api.mjs';
import {useSessionTimetable} from '@/hooks/cinema/localizacoes/use-session-timetable';
export default function Timetable({loc,date,rooms}){
 const {list,films,filmsLoading,filmsError,retryFilms}=useSessionTimetable(loc.id,date);
 return <div>
  {filmsLoading&&<p role="status" className="mb-3 text-sm">Carregando informações dos filmes…</p>}
  {filmsError&&<div role="alert" className="mb-4 text-sm"><p>Não foi possível carregar alguns filmes. Os horários abaixo vêm da programação.</p><Button variant="outline" onClick={retryFilms}>Tentar carregar filmes novamente</Button></div>}
  <div className="space-y-3">{list.items.map(s=>{const film=films[s.id_filme],room=rooms.items.find(r=>r.id_sala===s.id_sala);return <article key={s.id_sessao} className="grid gap-4 rounded-lg border border-border bg-background/40 p-4 sm:grid-cols-[1fr_auto]">
   <div className="flex min-w-0 items-center gap-3"><div className="h-[72px] w-12 shrink-0 overflow-hidden rounded-md bg-muted"><PosterImg src={publicAsset(film?.imagem)} title={film?.titulo||'Filme'}/></div><div className="min-w-0"><h4 className="f-title text-lg font-bold">{film?.titulo||`Filme #${s.id_filme}`}</h4><p className="mt-1 text-xs text-muted-foreground">{room?.nome||`Sala #${s.id_sala}`} · {s.idioma}</p>{film?.classificacao&&<div className="mt-2"><AgeBadge age={film.classificacao}/></div>}</div></div>
   <div className="self-center"><p className="text-lg font-bold text-primary">{s.horario_inicio.slice(0,5)} — {s.horario_fim.slice(0,5)}</p>{s.data_fim!==s.data&&<p className="text-xs">Término em {s.data_fim.split('-').reverse().join('/')}</p>}<p className="mt-1 text-sm">{Number(s.preco_inteira).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · inteira</p><p className="mt-1 text-xs text-muted-foreground">{({AGENDADA:'Agendada',EM_CARTAZ:'Em andamento',ENCERRADA:'Encerrada',CANCELADA:'Cancelada'})[s.status]||'Status a confirmar'}</p></div>
  </article>;})}</div>
  <ListStatus list={list} empty="Nenhuma sessão disponível para esta data." more="Carregar mais sessões"/>
 </div>;
}
