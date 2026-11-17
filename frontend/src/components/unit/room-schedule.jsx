'use client';

import { useState } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { UnitListState, UnitMore, label } from './unit-layout';
import styles from './unit.module.css';

export default function RoomSchedule({ room, localId, request }) {
  const [date, setDate] = useState('');
  const filters = new URLSearchParams({ localId, roomId: room.id_sala, limit: '10' });
  if (date) filters.set('date', date);
  const sessions = usePaginatedList(`sessions?${filters}`, request);

  return <section className={styles.panel} aria-labelledby="room-schedule-title">
    <header className={styles.panelHeader}>
      <div><h2 id="room-schedule-title">Programação · {room.nome}</h2>
        <p>{room.tipo} · {room.capacidade} lugares · {label(room.status)}</p></div>
    </header>
    <div className={styles.body}>
      <div className={styles.toolbar}>
        <label className={styles.field}>Data da sessão<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
        <button type="button" className={styles.secondary} disabled={sessions.loading} onClick={sessions.reload}>Atualizar ocupação</button>
      </div>
      <UnitListState list={sessions} empty="Nenhuma sessão encontrada para a sala nesta consulta." />
      {sessions.items.length > 0 && <ul className={styles.list}>
        {sessions.items.map(session => <li key={session.id_sessao}>
          <div><strong>{session.titulo_filme}</strong>
            <small>{session.data.split('-').reverse().join('/')} · {session.horario_inicio.slice(0, 5)}–{session.horario_fim.slice(0, 5)} · {label(session.status)}</small>
          </div>
          <div>
            <strong>{session.activeSeats - session.availableSeats} de {session.activeSeats} ocupados ou reservados</strong>
            <small>{session.availableSeats} livres</small>
          </div>
        </li>)}
      </ul>}
      <UnitMore list={sessions} noun="sessões" />
    </div>
  </section>;
}
