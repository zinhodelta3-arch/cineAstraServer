'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ListChecks, Pencil, Plus, UserRoundPlus, Users, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminSchedule } from '@/hooks/admin/use-admin-schedule';
import { useAdminPeople } from '@/hooks/admin/use-admin-people';
import { teamRequest, useAdminTeams, useTeamActions } from '@/hooks/admin/use-admin-teams';
import TeamLayout, { label, TeamFooter, TeamState } from './team-layout';
import styles from '../catalog/catalog.module.css';

export default function TeamsAdmin() {
  const list = useAdminTeams('teams?limit=20');
  const scheduled = useAdminSchedule('sessions?limit=100&status=AGENDADA');
  const showing = useAdminSchedule('sessions?limit=100&status=EM_CARTAZ');
  const supervisors = useAdminPeople('users?limit=100&role=SUPERVISOR&status=ATIVO');
  const actions = useTeamActions(list);
  const [sessionId, setSessionId] = useState('');
  const [createdId, setCreatedId] = useState(null);
  const item = actions.dialog?.item;
  const sessions = [...scheduled.items, ...showing.items];

  function open(type, row = null) { setSessionId(''); setCreatedId(null); actions.open(type, row); }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), nome = String(form.get('nome') ?? '').trim(), supervisorId = String(form.get('supervisorId') ?? '');
    if (!nome || nome.length > 100 || !supervisorId || !item && !sessionId) { actions.setError('Informe nome, sessão e supervisor.'); return; }
    const body = item ? { ...(nome !== item.nome ? { nome } : {}), ...(supervisorId !== item.id_supervisor ? { supervisorId } : {}) } : { nome, sessionId, supervisorId };
    if (!Object.keys(body).length) { actions.setError('Nenhuma alteração para salvar.'); return; }
    actions.run(() => teamRequest(item ? `teams/${item.id_equipe}` : 'teams', { method: item ? 'PATCH' : 'POST', body }), item ? 'Equipe atualizada.' : result => `Equipe #${result.id_equipe} criada.`, result => { if (!item) setCreatedId(result.id_equipe); });
  }

  return <TeamLayout title="Equipes" description="Organize as equipes responsáveis pelas sessões do cinema." action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Nova equipe</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}{createdId && <> <Link href={`/admin/equipes/membros?teamId=${createdId}`}>Abrir equipe</Link></>}</p>}
    <section className={styles.panel} aria-labelledby="teams-title"><header className={styles.panelHeader}><div><h2 id="teams-title">Equipes cadastradas</h2><p>Cada sessão pode ter uma equipe ativa.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <TeamState list={list} empty="Nenhuma equipe cadastrada." noun="equipes" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de equipes; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Equipes</caption><thead><tr><th scope="col">Equipe</th><th scope="col">Sessão</th><th scope="col">Supervisor</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_equipe}><th scope="row">{row.nome}<small className={styles.muted}> · #{row.id_equipe}</small></th><td>{sessions.find(session => session.id_sessao === row.id_sessao)?.titulo_filme ?? 'Sessão'}<small className={styles.muted}> · #{row.id_sessao}</small></td><td>{supervisors.items.find(user => user.id === row.id_supervisor)?.name ?? `#${row.id_supervisor}`}</td><td><span className={`${styles.badge} ${row.status === 'ATIVA' ? '' : styles.inactive}`}>{label(row.status)}</span></td><td><div className={styles.actions}><Link className={styles.iconButton} href={`/admin/equipes/membros?teamId=${row.id_equipe}`} title="Ver membros" aria-label={`Membros da equipe ${row.nome}`}><Users size={16} aria-hidden="true" /></Link><Link className={styles.iconButton} href={`/admin/equipes/entradas?teamId=${row.id_equipe}`} title="Ver entradas" aria-label={`Entradas da equipe ${row.nome}`}><UserRoundPlus size={16} aria-hidden="true" /></Link><Link className={styles.iconButton} href={`/admin/equipes/chamados?teamId=${row.id_equipe}`} title="Ver chamados" aria-label={`Chamados da equipe ${row.nome}`}><ListChecks size={16} aria-hidden="true" /></Link>{row.status === 'ATIVA' && <><button type="button" className={styles.iconButton} title="Editar equipe" aria-label={`Editar equipe ${row.nome}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Finalizar equipe" aria-label={`Finalizar equipe ${row.nome}`} onClick={() => open('finalize', row)}><Check size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Cancelar equipe" aria-label={`Cancelar equipe ${row.nome}`} onClick={() => open('cancel', row)}><XCircle size={16} aria-hidden="true" /></button></>}</div></td></tr>)}</tbody></table></div>}
      {list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}
      <TeamFooter list={list} noun="equipes" />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'form' ? item ? 'Editar equipe' : 'Nova equipe' : actions.dialog?.type === 'finalize' ? 'Finalizar equipe' : 'Cancelar equipe'}</DialogTitle>
      {actions.dialog?.type === 'form' && <><DialogDescription className={styles.dialogDescription}>{item ? 'Atualize o nome ou o supervisor da equipe.' : 'Selecione uma sessão agendada ou em cartaz e um supervisor ativo.'}</DialogDescription><form key={item?.id_equipe ?? 'new'} className={styles.form} onSubmit={save}><label className={styles.wide}>Nome<input name="nome" maxLength={100} defaultValue={item?.nome ?? ''} required /></label>{!item && <label className={styles.wide}>Sessão<select value={sessionId} onChange={event => setSessionId(event.target.value)} required><option value="">Selecione</option>{sessions.map(row => <option key={row.id_sessao} value={row.id_sessao}>{row.titulo_filme ?? 'Sessão'} · {row.data} {row.horario_inicio} · #{row.id_sessao}</option>)}</select></label>}<label className={styles.wide}>Supervisor<select name="supervisorId" defaultValue={item?.id_supervisor ?? ''} required><option value="">Selecione</option>{item?.id_supervisor && !supervisors.items.some(user => user.id === item.id_supervisor) && <option value={item.id_supervisor}>Supervisor #{item.id_supervisor}</option>}{supervisors.items.map(user => <option key={user.id} value={user.id}>{user.name} · #{user.id}</option>)}</select></label><div className={`${styles.wide} ${styles.checks}`}>{scheduled.nextCursor && <button type="button" className={styles.secondary} onClick={scheduled.loadMore} disabled={scheduled.loadingMore}>Mais sessões agendadas</button>}{showing.nextCursor && <button type="button" className={styles.secondary} onClick={showing.loadMore} disabled={showing.loadingMore}>Mais sessões em cartaz</button>}{supervisors.nextCursor && <button type="button" className={styles.secondary} onClick={supervisors.loadMore} disabled={supervisors.loadingMore}>Mais supervisores</button>}</div>{(scheduled.error || showing.error || supervisors.error) && <p className={`${styles.error} ${styles.wide}`} role="alert">{scheduled.error || showing.error || supervisors.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar equipe'}</button></div></form></>}
      {['finalize', 'cancel'].includes(actions.dialog?.type) && <><DialogDescription className={styles.dialogDescription}>{actions.dialog.type === 'finalize' ? `A equipe ${item?.nome} será marcada como finalizada.` : `A equipe ${item?.nome} será cancelada e as entradas pendentes serão encerradas.`}</DialogDescription><div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="button" className={actions.dialog.type === 'cancel' ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => teamRequest(`teams/${item.id_equipe}`, actions.dialog.type === 'finalize' ? { method: 'PATCH', body: { status: 'FINALIZADA' } } : { method: 'DELETE' }), actions.dialog.type === 'finalize' ? 'Equipe finalizada.' : 'Equipe cancelada.')}>{actions.pending ? 'Aguarde…' : actions.dialog.type === 'finalize' ? 'Finalizar' : 'Cancelar equipe'}</button></div></>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </TeamLayout>;
}
