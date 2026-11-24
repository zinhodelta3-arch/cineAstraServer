'use client';

import { useUnitAction, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState, UnitMore, dateTime } from './unit-layout';
import styles from './unit.module.css';
import { teamSchedule } from '@/lib/team-schedule.mjs';

const statuses = { PENDENTE: 'Pendente', ACEITA: 'Aprovada', RECUSADA: 'Rejeitada', CANCELADA: 'Cancelada' };

export default function UnitJoinRequests({ onRefresh, entryId }) {
  const available = useUnitList('/available?limit=10');
  const filter=entryId?`&entryId=${entryId}`:'';
  const history = useUnitList('/my-requests?limit=10'+filter);
  const invitations = useUnitList('/my-invitations?limit=10'+filter);

  function refresh() {
    available.reload();
    history.reload();
    invitations.reload();
  }

  function refreshMembership() {
    refresh();
    onRefresh?.();
  }

  const action = useUnitAction(refresh);
  const invitationAction=useUnitAction(refreshMembership);
  async function answer(invite,decision){
    const saved=await invitationAction.run(`/${invite.id_equipe}/entries/${invite.id_entrada}/decision`,
      {method:'POST',body:{decision}},decision==='ACEITAR'?'Convite aceito.':'Convite recusado.');
    if(!saved)invitations.reload();
  }

  return <>
    <UnitFeedback error={action.error} notice={action.notice} />
    <section className={styles.panel} aria-labelledby="received-invites-title">
      <header className={styles.panelHeader}><h2 id="received-invites-title">Convites recebidos</h2></header>
      <div className={styles.body}>
        <UnitFeedback error={invitationAction.error} notice={invitationAction.notice} />
        <UnitListState list={invitations} empty="Você ainda não recebeu convites para equipes." />
        {invitations.items.length>0&&<ul className={styles.list}>{invitations.items.map(invite=><li key={invite.id_entrada}>
          <div><strong>{invite.nome}</strong>
            <small>{invite.cinema} · {teamSchedule({date:invite.data,start:invite.horario_inicio,end:invite.horario_fim})}</small>
            <small>{invite.funcao_proposta}</small>
            {invite.status==='PENDENTE'&&<small>Disponível até {dateTime(invite.expiresAt)}.</small>}
          </div>
          <div className={styles.row}>
            {invite.status==='PENDENTE'?<>
              <button type="button" className={styles.button} disabled={invitationAction.pending} onClick={()=>answer(invite,'ACEITAR')}>Aceitar convite</button>
              <button type="button" className={styles.secondary} disabled={invitationAction.pending} onClick={()=>answer(invite,'RECUSAR')}>Recusar convite</button>
            </>:<span className={styles.badge}>{invite.status==='CANCELADA'?'Encerrado':statuses[invite.status]}</span>}
          </div>
        </li>)}</ul>}
        {invitations.items.length>0&&<UnitMore list={invitations} noun="convites" />}
      </div>
    </section>
    <section className={styles.panel} aria-labelledby="available-teams-title">
      <header className={styles.panelHeader}><div>
        <h2 id="available-teams-title">Equipes disponíveis</h2>
        <p>{available.data?.hasTeam ? 'Você pode solicitar ingresso em outras equipes do cinema onde já atua.' : 'O supervisor responsável vai avaliar sua solicitação.'}</p>
      </div></header>
      <div className={styles.body}>
        <UnitListState list={available} empty="Nenhuma equipe disponível para solicitação no momento." />
        {available.items.length > 0 && <ul className={styles.list}>{available.items.map(team => <li key={team.id_equipe}>
          <div><strong>{team.nome}</strong><small>{team.cinema} · {teamSchedule({date:team.data,start:team.horario_inicio,end:team.horario_fim})}</small></div>
          <button type="button" className={styles.secondary} disabled={action.pending} onClick={() =>
            action.run(`/${team.id_equipe}/entries/requests`, { method: 'POST', body: {} }, 'Solicitação enviada ao supervisor.')
          }>Solicitar ingresso</button>
        </li>)}</ul>}
        {available.items.length>0&&<UnitMore list={available} noun="equipes" />}
      </div>
    </section>
    <section className={styles.panel} aria-labelledby="join-history-title">
      <header className={styles.panelHeader}>
        <h2 id="join-history-title">Minhas solicitações</h2>
        <button type="button" className={styles.secondary} disabled={action.pending || history.loading} onClick={refreshMembership}>Atualizar</button>
      </header>
      <div className={styles.body}>
        <UnitListState list={history} empty="Você ainda não enviou solicitações de ingresso." />
        {history.items.length > 0 && <ul className={styles.list}>{history.items.map(entry => <li key={entry.id_entrada}>
          <div><strong>{entry.nome}</strong><small>Enviada em {dateTime(entry.criado_em)}{entry.decidido_em && ` · Atualizada em ${dateTime(entry.decidido_em)}`}</small>
            {entry.status==='PENDENTE'&&<small>Disponível até {dateTime(entry.expiresAt)}.</small>}</div>
          <span className={styles.badge}>{statuses[entry.status]}</span>
        </li>)}</ul>}
        <UnitMore list={history} />
      </div>
    </section>
  </>;
}
