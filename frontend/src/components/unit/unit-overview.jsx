'use client';

import Link from 'next/link';
import { Armchair, ArrowRight, Clapperboard, Film, ListChecks, MapPin, Popcorn, UsersRound } from 'lucide-react';
import { useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import { teamSchedule } from '@/lib/team-schedule.mjs';
import UnitLayout, { UnitListState, UnitMore } from './unit-layout';
import styles from './unit.module.css';

export default function UnitOverview({ supervisor = false }) {
  const context = useUnitContext();
  const teams = useUnitList('?limit=20');
  const withoutTeam = !teams.loading && !teams.error && !teams.hasNext &&
    !teams.items.some(team=>team.status==='ATIVA'&&team.sessionOpen&&(supervisor||team.myFunction));
  return <UnitLayout title="Visão geral da unidade" description={supervisor ? 'Acompanhe a programação, o AstraSnack e a equipe do seu cinema.' : 'Acompanhe suas equipes e os chamados operacionais em um só lugar.'} location={context.locations.map(row => row.nome).join(' · ')}>
    {context.error && <p className={`${styles.message} ${styles.error}`} role="alert">{context.error}</p>}
    {withoutTeam&&!context.loading&&!context.error&&<section className={`${styles.panel} ${styles.ticket} mb-5`} aria-labelledby="team-guide">
      <div className={styles.panelHeader}>
        <div><h2 id="team-guide">{supervisor&&!context.locations.length?'Aguardando vínculo com um cinema':'Nenhuma equipe em atuação'}</h2>
          <p>{supervisor ? context.locations.length ? 'Vincule uma nova equipe a uma sessão disponível no seu cinema.' : 'O administrador precisa atribuir seu cinema para que você possa criar equipes.' : 'Você pode consultar equipes disponíveis e solicitar ingresso. A participação começa após aprovação.'}</p>
        </div>
        {(!supervisor||context.locations.length>0)&&<Link prefetch={false} className={styles.secondary}
          href={supervisor?'/unidade/equipes#new-team-title':'/unidade/equipes#available-teams-title'}>
          {supervisor?'Criar equipe':'Ver equipes disponíveis'} <ArrowRight size={16} aria-hidden="true" />
        </Link>}
      </div>
    </section>}
    <div className={styles.grid}>
      <div className={styles.card}><span className={styles.cardIcon}><MapPin size={19} /></span><strong>{context.loading ? 'Carregando…' : context.locations.map(row => row.nome).join(', ') || 'Nenhum cinema vinculado'}</strong><p>Cinema associado à sua conta ou equipe.</p></div>
      <Link prefetch={false} className={styles.card} href="/unidade/equipes"><span className={styles.cardIcon}><UsersRound size={19} /></span><strong>Equipes</strong><p>{teams.loading ? 'Consultando equipes…' : `${teams.items.length} equipe(s) carregada(s)`}</p><span className={styles.cardFooter}>Ver equipes <ArrowRight size={16} /></span></Link>
      <Link prefetch={false} className={styles.card} href="/unidade/chamados"><span className={styles.cardIcon}><ListChecks size={19} /></span><strong>Chamados</strong><p>Abra e acompanhe tarefas da equipe.</p><span className={styles.cardFooter}>Ver chamados <ArrowRight size={16} /></span></Link>
      {<><Link prefetch={false} className={styles.card} href="/unidade/filmes"><span className={styles.cardIcon}><Film size={19} /></span><strong>Filmes</strong><p>Veja os filmes programados neste cinema.</p><span className={styles.cardFooter}>Ver filmes <ArrowRight size={16} /></span></Link><Link prefetch={false} className={styles.card} href="/unidade/sessoes"><span className={styles.cardIcon}><Clapperboard size={19} /></span><strong>Sessões</strong><p>Consulte datas, horários e estados das exibições.</p><span className={styles.cardFooter}>Ver sessões <ArrowRight size={16} /></span></Link><Link prefetch={false} className={styles.card} href="/unidade/salas"><span className={styles.cardIcon}><Armchair size={19} /></span><strong>Salas</strong><p>Consulte salas e assentos da unidade.</p><span className={styles.cardFooter}>Ver salas <ArrowRight size={16} /></span></Link><Link prefetch={false} className={styles.card} href="/unidade/astrasnack"><span className={styles.cardIcon}><Popcorn size={19} /></span><strong>AstraSnack</strong><p>Acompanhe o estoque e os combos locais.</p><span className={styles.cardFooter}>Ver AstraSnack <ArrowRight size={16} /></span></Link></>}
    </div>
    <section className={styles.panel} aria-labelledby="unit-teams-title"><div className={styles.panelHeader}><div><h2 id="unit-teams-title">Equipes vinculadas</h2><p>Somente equipes do seu cinema ou aquelas às quais você pertence.</p></div></div><div className={styles.body}><UnitListState list={teams} empty="Ainda não há equipes vinculadas à sua conta." />{teams.items.length > 0 && <ul className={styles.list}>{teams.items.map(team => <li key={team.id_equipe}><div><strong>{team.nome}</strong><small>{team.location?.name && `${team.location.name} · `}{teamSchedule(team.schedule)}</small>{!supervisor && <small>Minha função: {team.myFunction || 'Sem função ativa'}</small>}</div><div className={styles.row}><span className={styles.badge}>{team.status}</span><Link prefetch={false} href={`/unidade/chamados?teamId=${team.id_equipe}${supervisor ? '' : '&assigned=me'}`} className={styles.iconButton} aria-label={`Ver chamados da equipe ${team.nome}`}><ArrowRight size={17} /></Link></div></li>)}</ul>}<UnitMore list={teams} /></div></section>
  </UnitLayout>;
}
