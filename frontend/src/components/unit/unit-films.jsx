'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Film } from 'lucide-react';
import { unitOperation, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitListState, UnitMore, label } from './unit-layout';
import styles from './unit.module.css';

export default function UnitFilms() {
  const context = useUnitContext();
  const sessions = useUnitList('/sessions?limit=100', unitOperation);
  const films = new Map();
  for (const row of sessions.items) {
    if (!['AGENDADA', 'EM_CARTAZ'].includes(row.status)) continue;
    const current = films.get(row.id_filme) ?? { id: row.id_filme, titulo: row.titulo_filme, sessions: [] };
    current.sessions.push(row);
    films.set(row.id_filme, current);
  }
  return <UnitLayout title="Filmes da unidade" description="Filmes com sessões agendadas ou em cartaz no seu cinema." location={context.locations[0]?.nome}>
    {context.error && <p className={`${styles.message} ${styles.error}`} role="alert">{context.error}</p>}
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Programação por filme</h2><p>O cadastro do filme é geral; as sessões abaixo pertencem à sua unidade.</p></div><span className={styles.badge}>{films.size} filmes</span></div><div className={styles.body}><UnitListState list={sessions} empty="Nenhuma sessão cadastrada neste cinema." /><div className={styles.filmGrid}>{[...films.values()].map(film => <article key={film.id} className={`${styles.card} ${styles.ticket}`}><span className={styles.cardIcon}><Film size={19} /></span><strong>{film.titulo}</strong><p>{film.sessions.length} sessão(ões) carregada(s)</p><ul className={styles.list}>{film.sessions.slice(0, 3).map(row => <li key={row.id_sessao}><div><small><CalendarDays size={13} /> {row.data?.slice(0, 10)} · {row.horario_inicio?.slice(0, 5)} · {row.nome_sala}</small></div><span className={styles.badge}>{label(row.status)}</span></li>)}</ul><Link href="/unidade/sessoes" className={styles.cardFooter}>Ver sessões <ArrowRight size={16} /></Link></article>)}</div><UnitMore list={sessions} /></div></section>
  </UnitLayout>;
}
