"use client";

import Link from 'next/link';
import { X } from 'lucide-react';
import { useHomeSessions } from '@/hooks/cinema/home/use-home-sessions';
import { formatBrl } from '@/lib/price-brl.mjs';
import { SessionAlternatives, sessionAvailability, useSessionClock } from '../filmes/session-availability';
import ticketStyles from '../ticket.module.css';
import ListStatus from './list-status';
import styles from './session-list-modal.module.css';

const dateOptions = { timeZone: 'UTC' };
const shortDay = new Intl.DateTimeFormat('pt-BR', { ...dateOptions, day: '2-digit', month: 'short' });
const longDay = new Intl.DateTimeFormat('pt-BR', { ...dateOptions, day: 'numeric', month: 'long' });
const weekday = new Intl.DateTimeFormat('pt-BR', { ...dateOptions, weekday: 'short' });
const calendarDate = day => new Date(`${day}T12:00:00Z`);

export default function SessionListModal({ movie, onClose }) {
 const {
  dialogRef, date, setDate, localId, setLocalId, locations, rooms, sessions,
  days, available, availability, refreshAvailability, retryDays,
 } = useHomeSessions(movie);
 const now = useSessionClock();
 const roomsById = new Map(rooms.items.map(room => [String(room.id_sala), room]));
 const showtimes = [...available]
  .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))
  .map(session => ({ session, status: sessionAvailability(session, now) }));
 const showAlternatives = !days.loading && !sessions.loading && !showtimes.some(({ status }) => status.bookable);
 const selectedLocalIsListed = locations.items.some(local => String(local.id_local) === String(localId));

 return (
  <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="home-session-title" className={styles.dialog}>
   <div className={styles.top}>
    <header className="pr-11">
     <p className="text-xs font-bold tracking-wider text-primary uppercase">Consultar sessões</p>
     <h2 id="home-session-title" className={`${ticketStyles.title} mt-1 text-[clamp(1.8rem,5vw,2.65rem)] font-bold leading-tight`}>{movie.title}</h2>
    </header>
    <button type="button" aria-label="Fechar" onClick={onClose} className={`${styles.close} ${styles.control}`}>
     <X size={18} aria-hidden="true" />
    </button>
    <div className={styles.filters}>
     <div className="min-w-0">
      <label htmlFor="home-session-cinema" className={styles.label}>Cinema</label>
      <select id="home-session-cinema" className={`${styles.select} ${styles.control}`} value={localId} onChange={event => setLocalId(event.target.value)}>
       <option value="">Selecione o cinema</option>
       {localId && !selectedLocalIsListed && <option value={localId}>{availability.items.find(item => String(item.localId) === String(localId))?.name ?? 'Cinema selecionado'}</option>}
       {locations.items.map(local => <option key={local.id_local} value={local.id_local}>{local.nome} — {local.cidade}</option>)}
      </select>
      {(locations.loading || locations.error || locations.cursor || !locations.items.length) && (
       <ListStatus list={locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas" />
      )}
     </div>
     <fieldset className="min-w-0">
      <legend className={styles.label}>Data</legend>
      {!localId && <p className="text-sm text-muted-foreground">Escolha um cinema para ver as datas.</p>}
      {days.loading && <p role="status" className="text-sm text-muted-foreground">Carregando datas…</p>}
      {days.error && <div role="alert" className="text-sm"><p>{days.error}</p><button type="button" className={`${styles.retry} ${styles.control}`} onClick={retryDays}>Tentar novamente</button></div>}
      {localId && !days.loading && !days.error && !days.items.length && <p className="text-sm text-muted-foreground">Sem sessões futuras neste cinema.</p>}
      {!!days.items.length && <div className={styles.days}>
       {days.items.map(day => (
        <button key={day} type="button" aria-pressed={date === day} onClick={() => setDate(day)} className={`${styles.day} ${styles.control}`}>
         <strong>{shortDay.format(calendarDate(day)).replace('.', '')}</strong>
         <span className="block text-xs">{weekday.format(calendarDate(day)).replace('.', '')}</span>
        </button>
       ))}
      </div>}
     </fieldset>
    </div>
   </div>
   <section className={styles.stub} aria-labelledby="home-session-times">
    <h3 id="home-session-times" className="text-lg font-bold">{date ? `Horários · ${longDay.format(calendarDate(date))}` : 'Horários'}</h3>
    {!localId && <p className="mt-2 text-sm text-muted-foreground">Selecione um cinema para consultar a programação.</p>}
    {localId && !date && !days.loading && !days.error && <p className="mt-2 text-sm text-muted-foreground">Consulte os horários alternativos, se houver disponibilidade.</p>}
    {date && (
     <>
      {!!showtimes.length && (
       <ul className="mt-3 grid gap-2">
        {showtimes.map(({ session, status }) => {
         const room = roomsById.get(String(session.id_sala));
         const time = session.horario_inicio.slice(0, 5);
         const details = [room?.tipo, session.idioma].filter(Boolean).join(' · ');

         return (
          <li key={session.id_sessao} className={styles.row}>
           <time dateTime={time} className={`${ticketStyles.title} text-[1.7rem] leading-none font-bold whitespace-nowrap tabular-nums`}>{time}</time>
           <div className="min-w-0 wrap-anywhere">
            <p className="font-semibold">{room?.nome ?? session.nome_sala ?? 'Sala a confirmar'}</p>
            {details && <p className="text-xs text-muted-foreground">{details}</p>}
           </div>
           <p className="text-right text-sm font-bold whitespace-nowrap">{formatBrl(session.preco_inteira)}<span className="block text-xs font-normal text-muted-foreground">Inteira</span></p>
           <div className={styles.booking}>
            {status.bookable && <Link href={`/cinema/sessao/assentos?sessionId=${session.id_sessao}`} aria-label={`Escolher assentos para ${time}`} className={`${styles.action} ${styles.control}`}>Escolher assentos</Link>}
            <p className={`text-xs ${status.low || status.soon ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{status.label}</p>
           </div>
          </li>
         );
        })}
       </ul>
      )}
      {!sessions.loading && !sessions.error && !showtimes.length && <p className="mt-3 text-sm text-muted-foreground">{sessions.cursor ? 'Há mais horários para consultar.' : 'Nenhuma sessão para a data e o cinema escolhidos.'}</p>}
      {(sessions.loading || sessions.error || sessions.cursor) && <ListStatus list={sessions} empty="" more="Carregar mais sessões" />}
      {!!showtimes.length && <p className="mt-3 text-xs text-muted-foreground">Horários em UTC.</p>}
      {(rooms.error || rooms.cursor) && <ListStatus list={rooms} empty="" more="Carregar mais salas" />}
     </>
    )}
    {showAlternatives && <SessionAlternatives availability={availability} localId={localId} date={date} onSelect={setLocalId} />}
    {localId && <button type="button" className={`${styles.retry} ${styles.control}`} disabled={days.loading || sessions.loading || availability.loading} onClick={refreshAvailability}>Atualizar disponibilidade</button>}
   </section>
  </dialog>
 );
}
