'use client';

import { useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime } from './unit-layout';
import styles from './unit.module.css';

const statuses = { PENDENTE: 'Pendente', ACEITA: 'Aprovada', RECUSADA: 'Rejeitada', CANCELADA: 'Cancelada' };

export default function UnitJoinRequests() {
  const available = useUnitList('/available?limit=10');
  const history = useUnitList('/my-requests?limit=10');

  function refresh() {
    available.reload();
    history.reload();
  }

  const action = useUnitAction(refresh);

  return <>
    <UnitFeedback error={action.error} notice={action.notice} />
    <section className={styles.panel} aria-labelledby="available-teams-title">
      <header className={styles.panelHeader}><div>
        <h2 id="available-teams-title">Equipes disponíveis</h2>
        <p>{available.data?.hasTeam ? 'Você já possui uma equipe ativa.' : 'Solicite ingresso. O supervisor da equipe vai avaliar seu pedido.'}</p>
      </div></header>
      {!available.data?.hasTeam && <div className={styles.body}>
        <UnitListState list={available} empty="Nenhuma equipe disponível para solicitação no momento." />
        {available.items.length > 0 && <ul className={styles.list}>{available.items.map(team => <li key={team.id_equipe}>
          <div><strong>{team.nome}</strong><small>{team.cinema} · {team.data.split('-').reverse().join('/')} às {team.horario_inicio.slice(0, 5)}</small></div>
          <button type="button" className={styles.secondary} disabled={action.pending} onClick={() =>
            action.run(`/${team.id_equipe}/entries/requests`, { method: 'POST', body: {} }, 'Solicitação enviada ao supervisor.')
          }>Solicitar ingresso</button>
        </li>)}</ul>}
        <UnitMore list={available} />
      </div>}
    </section>
    <section className={styles.panel} aria-labelledby="join-history-title">
      <header className={styles.panelHeader}>
        <h2 id="join-history-title">Minhas solicitações</h2>
        <button type="button" className={styles.secondary} disabled={action.pending || history.loading} onClick={refresh}>Atualizar</button>
      </header>
      <div className={styles.body}>
        <UnitListState list={history} empty="Você ainda não enviou solicitações de ingresso." />
        {history.items.length > 0 && <ul className={styles.list}>{history.items.map(entry => <li key={entry.id_entrada}>
          <div><strong>{entry.nome}</strong><small>Enviada em {dateTime(entry.criado_em)}{entry.decidido_em && ` · Atualizada em ${dateTime(entry.decidido_em)}`}</small></div>
          <span className={styles.badge}>{statuses[entry.status]}</span>
        </li>)}</ul>}
        <UnitMore list={history} />
      </div>
    </section>
  </>;
}
