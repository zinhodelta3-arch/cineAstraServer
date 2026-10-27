"use client";
import { useHomeSessions } from '@/hooks/cinema/home/use-home-sessions';
import ListStatus from './list-status';
import { Button } from './home-ui';
export default function SessionListModal({ movie, onClose }) {
 const { dialogRef, today, date, setDate, localId, setLocalId, locations, rooms, sessions, available } = useHomeSessions(movie);
 return <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="home-session-title" className="m-auto max-h-[85vh] w-[min(94vw,760px)] overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/70">
  <div className="flex items-start justify-between gap-4"><h2 id="home-session-title" className="f-display text-3xl font-bold">Sessões de {movie.title}</h2><Button variant="outline" size="sm" onClick={onClose}>Fechar</Button></div>
  <div className="my-6 grid gap-4 sm:grid-cols-2">
   <label className="space-y-2">Cinema<select aria-label="Cinema" className="block w-full rounded-lg border border-border bg-background p-3" value={localId} onChange={e => setLocalId(e.target.value)}><option value="">Selecione o cinema</option>{locations.items.map(l => <option key={l.id_local} value={l.id_local}>{l.nome} — {l.cidade}</option>)}</select></label>
   <label className="space-y-2">Data (UTC)<input aria-label="Data (UTC)" type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="block w-full rounded-lg border border-border bg-background p-3" /></label>
  </div>
  <ListStatus list={locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas" />
  {localId && <>
   <ListStatus list={rooms} empty="Nenhuma sala disponível." more="Carregar mais salas" />
   <p className="mb-4 text-sm text-muted-foreground">Horários em UTC. Valores de inteira cadastrados; descontos e disponibilidade são confirmados na compra.</p>
   <ul className="space-y-3">{available.map(s => <li key={s.id_sessao} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div><strong>{s.horario_inicio.slice(0,5)}</strong><p className="text-sm text-muted-foreground">{s.roomName} · {s.idioma}</p></div><span>{Number(s.preco_inteira).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></li>)}</ul>
   {!sessions.loading && !sessions.error && !available.length && <p className="my-4">{sessions.cursor ? 'Nenhuma sessão deste filme nesta parte da lista. Carregue mais para continuar a consulta.' : 'Nenhuma sessão futura deste filme na data e cinema escolhidos.'}</p>}
   <ListStatus list={sessions} empty="" more="Carregar mais sessões" />
  </>}
 </dialog>;
}
