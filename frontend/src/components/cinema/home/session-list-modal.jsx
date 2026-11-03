"use client";
import { useHomeSessions } from '@/hooks/cinema/home/use-home-sessions';
import ListStatus from './list-status';
import { X } from 'lucide-react';
import Link from 'next/link';
import CinemaStyles from './cinema-styles';
export default function SessionListModal({ movie, onClose }) {
 const { dialogRef, date, setDate, localId, setLocalId, locations, rooms, sessions, days, available } = useHomeSessions(movie);
 return <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="home-session-title" className="ticket m-auto max-h-[85vh] w-[min(94vw,760px)] overflow-y-auto border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/70" style={{'--n':'68%'}}>
  <CinemaStyles />
  <div className="perf !rounded-none" aria-hidden="true" />
  <div className="p-5 sm:p-7">
  <div className="flex items-start justify-between gap-4"><h2 id="home-session-title" className="f-display text-3xl font-bold">Sessões de {movie.title}</h2><button type="button" aria-label="Fechar" onClick={onClose} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><X className="size-5" aria-hidden="true" /></button></div>
  <div className="tear mt-5" aria-hidden="true" />
  <div className="my-6 grid gap-4 sm:grid-cols-2">
   <label className="space-y-2">Cinema<select aria-label="Cinema" className="block w-full rounded-lg border border-border bg-background p-3" value={localId} onChange={e => setLocalId(e.target.value)}><option value="">Selecione o cinema</option>{locations.items.map(l => <option key={l.id_local} value={l.id_local}>{l.nome} — {l.cidade}</option>)}</select></label>
   <div><p className="mb-2">Dias disponíveis</p>{days.loading && <p className="text-sm text-muted-foreground">Carregando dias...</p>}{days.error && <p role="alert" className="text-sm text-destructive">{days.error}</p>}{localId && !days.loading && !days.error && !days.items.length && <p className="text-sm text-muted-foreground">Nenhuma sessão futura deste filme neste cinema.</p>}<div className="flex flex-wrap gap-2">{days.items.map(day => <button key={day} type="button" aria-pressed={date === day} onClick={() => setDate(day)} className={`rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${date === day ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>{new Date(`${day}T12:00:00Z`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'})}</button>)}</div></div>
  </div>
  <ListStatus list={locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas" />
  {localId && date && <>
   <ListStatus list={rooms} empty="Nenhuma sala disponível." more="Carregar mais salas" />
   <p className="mb-4 text-sm text-muted-foreground">Horários em UTC. Valores de inteira cadastrados; descontos e disponibilidade são confirmados na compra.</p>
   <ul className="grid gap-3 sm:grid-cols-2">{available.map(s => <li key={s.id_sessao} className="ticket flex min-h-32 flex-col justify-between border border-border bg-background" style={{'--n':'56%'}}><div className="perf !h-1 !rounded-none" aria-hidden="true" /><div className="flex items-start justify-between gap-3 px-4 pt-3"><div><strong className="f-display text-4xl leading-none text-foreground">{s.horario_inicio.slice(0,5)}</strong><p className="mt-1 text-sm text-muted-foreground">{s.roomName} · {s.idioma}</p></div></div><div className="tear mx-4 mt-3" aria-hidden="true" /><div className="flex items-center justify-between gap-2 px-4 py-3 text-sm"><span className="text-muted-foreground">Inteira</span><strong className="text-lg text-primary">{Number(s.preco_inteira).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div><Link href={`/cinema/sessao/assentos?sessionId=${s.id_sessao}`} className="mx-4 mb-3 rounded-md border border-primary px-3 py-2 text-center text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">Escolher assentos</Link></li>)}</ul>
   {!sessions.loading && !sessions.error && !available.length && <p className="my-4">{sessions.cursor ? 'Nenhuma sessão deste filme nesta parte da lista. Carregue mais para continuar a consulta.' : 'Nenhuma sessão futura deste filme na data e cinema escolhidos.'}</p>}
   <ListStatus list={sessions} empty="" more="Carregar mais sessões" />
  </>}
  </div>
 </dialog>;
}
