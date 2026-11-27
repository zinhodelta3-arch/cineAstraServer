"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ListStatus from '@/components/cinema/home/list-status';
import { usePublicList } from '@/hooks/cinema/home/use-public-list';
import { formatBrl } from '@/lib/price-brl.mjs';
import { sessionAvailability, useSessionClock } from '../filmes/session-availability';
import ticketStyles from '../ticket.module.css';
import { AgeBadge } from './location-ui';
import styles from './location-panel.module.css';

const statusLabel = { AGENDADA: 'Agendada', EM_CARTAZ: 'Em andamento', ENCERRADA: 'Encerrada', CANCELADA: 'Cancelada' };

export default function Timetable({ loc, date, rooms }) {
 const list = usePublicList(`/sessions?${new URLSearchParams({ localId: loc.id, date, limit: '20' })}`);
 const now = useSessionClock();
 const roomsById = new Map(rooms.items.map(room => [String(room.id_sala), room]));

 return (
  <div>
   <div className="grid gap-3">
    {list.items.map(session => {
     const room = roomsById.get(String(session.id_sala));
     const availability = sessionAvailability(session, now);
     const start = session.horario_inicio.slice(0, 5);
     const end = session.horario_fim.slice(0, 5);
     const endDate = session.data_fim && session.data_fim !== session.data ? session.data_fim.split('-').reverse().join('/') : null;
     const details = [
      room?.nome ?? session.nome_sala ?? `Sala #${session.id_sala}`,
      room?.tipo,
      session.idioma?.toLocaleLowerCase('pt-BR'),
      `até ${end}${endDate ? ` de ${endDate}` : ''}`,
     ].filter(Boolean).join(' · ');

     return (
      <article key={session.id_sessao} className={styles.show}>
       <time dateTime={start} className={`${ticketStyles.title} ${styles.showTime}`}>{start}</time>
       <div className="min-w-0">
        <h4 className="text-sm font-bold wrap-anywhere">{session.titulo_filme || `Filme #${session.id_filme}`}</h4>
        <p className="mt-1 text-xs text-muted-foreground wrap-anywhere">{details}</p>
        {session.classificacao_filme && <div className="mt-1"><AgeBadge age={session.classificacao_filme} /></div>}
       </div>
       <p className="text-right text-sm font-bold whitespace-nowrap">{formatBrl(session.preco_inteira)}<span className="block text-xs font-normal text-muted-foreground">Inteira</span></p>
       <div className={styles.booking}>
        {availability.bookable && <Link href={`/cinema/sessao/assentos?sessionId=${session.id_sessao}`} className={styles.button}>
         Escolher assentos <ChevronRight size={15} aria-hidden="true" />
        </Link>}
        <p className={`text-xs ${availability.low || availability.soon ? 'text-primary' : 'text-muted-foreground'}`}>
         {availability.bookable ? availability.label : `${statusLabel[session.status] ?? 'Status a confirmar'} · ${availability.label}`}
        </p>
       </div>
      </article>
     );
    })}
   </div>
   {(list.loading || list.error || list.cursor || !list.items.length) && <ListStatus list={list} empty="Nenhuma sessão disponível para esta data." more="Carregar mais sessões" />}
  </div>
 );
}
