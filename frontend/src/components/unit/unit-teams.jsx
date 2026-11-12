'use client';

import { useRef, useState } from 'react';
import { Check, Pencil, Plus, UserRoundPlus, X } from 'lucide-react';
import { useSession } from '@/hooks/auth/use-session';
import { unitRequest, unitSessions, useUnitAction, useUnitContext, useUnitList, useUnitTeam } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import UnitJoinRequests from './unit-join-requests';
import styles from './unit.module.css';

export default function UnitTeams() {
  const { user } = useSession();
  const supervisor = user?.role === 'SUPERVISOR';
  const context = useUnitContext();
  const { teams, teamId, setTeamId, team } = useUnitTeam();
  const sessions = useUnitList(supervisor ? '?' : null, unitSessions);
  const entries = useUnitList(teamId ? `/${teamId}/entries?limit=100` : null);
  const members = useUnitList(teamId ? `/${teamId}/members?limit=100` : null);
  const [editing, setEditing] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const inviteLock = useRef(false);
  const actions = useUnitAction(() => { teams.reload(); entries.reload(); members.reload(); sessions.reload(); });
  const invite = entries.items.find(row => row.tipo === 'CONVITE' && row.status === 'PENDENTE' && row.id_usuario === user?.id);

  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nome = String(data.get('nome') ?? '').trim();
    const sessionId = String(data.get('sessionId') ?? '');
    if (!nome || nome.length > 100 || !sessionId) return actions.setError('Selecione uma sessão e informe o nome da equipe.');
    if (await actions.run('', { method: 'POST', body: { nome, sessionId } }, 'Equipe criada.')) form.reset();
  }

  async function rename(event) {
    event.preventDefault();
    const nome = String(new FormData(event.currentTarget).get('nome') ?? '').trim();
    if (!nome || nome.length > 100 || nome === team?.nome) return actions.setError('Informe um novo nome para a equipe.');
    if (await actions.run(`/${teamId}`, { method: 'PATCH', body: { nome } }, 'Equipe atualizada.')) setEditing(false);
  }

  async function inviteUser(event) {
    event.preventDefault();
    if (inviteLock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const funcao = String(data.get('funcao') ?? '').trim();
    const invitingTeamId = teamId;
    if (!email || email.length > 150 || !funcao || funcao.length > 100) return actions.setError('Informe o e-mail do colaborador e sua função.');
    inviteLock.current = true;
    setLookingUp(true);
    try {
      const collaborator = await unitRequest(`/collaborator?email=${encodeURIComponent(email)}`);
      if (await actions.run(`/${invitingTeamId}/entries/invitations`, { method: 'POST', body: { userId: collaborator.id, funcao } }, `Convite enviado para ${collaborator.name}.`)) form.reset();
    } catch (error) { actions.setError(error.message); }
    finally { inviteLock.current = false; setLookingUp(false); }
  }
  async function updateMember(event) {
    event.preventDefault();
    const funcao = String(new FormData(event.currentTarget).get('funcao') ?? '').trim();
    if (!funcao || funcao.length > 100) return actions.setError('Informe a função do colaborador.');
    if (await actions.run(`/${teamId}/members/${editingMember.id_equipe_membro}`, { method: 'PATCH', body: { funcao } }, 'Função atualizada.')) setEditingMember(null);
  }
  async function decideRequest(event, entry) {
    event.preventDefault();
    const funcao = String(new FormData(event.currentTarget).get('funcao') ?? '').trim();
    if (!funcao || funcao.length > 100) return actions.setError('Informe a função do colaborador.');
    await actions.run(`/${teamId}/entries/${entry.id_entrada}/decision`, { method: 'POST', body: { decision: 'ACEITAR', funcao } }, 'Solicitação aceita.');
  }

  return <UnitLayout title="Equipes" description="Consulte a equipe da sessão e acompanhe os convites e colaboradores." location={context.locations.map(row => row.nome).join(' · ')}>
    <UnitFeedback error={actions.error || context.error} notice={actions.notice} />
    {user?.role === 'COLABORADOR' && <UnitJoinRequests />}
    {supervisor && <section className={`${styles.panel} ${styles.ticket}`} aria-labelledby="new-team-title"><div className={styles.panelHeader}><div><h2 id="new-team-title">Nova equipe</h2><p>Associe a equipe a uma sessão do seu cinema.</p></div></div><div className={styles.body}><form className={styles.form} onSubmit={create}><label>Sessão<select name="sessionId" required disabled={sessions.loading || !sessions.items.length}><option value="">Selecione uma sessão</option>{sessions.items.map(row => <option key={row.id_sessao} value={row.id_sessao}>{row.titulo_filme ?? 'Filme'} · {row.data} {row.horario_inicio} · {row.nome_sala}</option>)}</select></label><label>Nome da equipe<input name="nome" maxLength={100} required placeholder="Ex.: Operação da sessão" /></label><button type="submit" className={styles.button} disabled={actions.pending || !sessions.items.length}><Plus size={16} />Criar equipe</button></form><UnitListState list={sessions} empty="Não há sessões disponíveis para formar equipe neste cinema." /><UnitMore list={sessions} /></div></section>}
    <section className={styles.panel} aria-labelledby="teams-title"><div className={styles.panelHeader}><div><h2 id="teams-title">Equipes vinculadas</h2><p>{supervisor ? 'Equipes do seu cinema.' : 'Equipes em que você atua ou recebeu um convite.'}</p></div><span className={styles.badge}>{teams.items.length} carregadas</span></div><div className={styles.body}><UnitListState list={teams} empty={supervisor ? 'Nenhuma equipe cadastrada neste cinema.' : 'Você ainda não participa de uma equipe nem recebeu convites.'} />{teams.items.length > 0 && <div className={styles.toolbar}><label className={styles.field}>Equipe<select className={styles.select} value={teamId} disabled={lookingUp || actions.pending} onChange={event => { setTeamId(event.target.value); setEditing(false); setEditingMember(null); }}>{team && !teams.items.some(row => row.id_equipe === teamId) && <option value={teamId}>{team.nome} · sessão #{team.id_sessao}</option>}{teams.items.map(row => <option key={row.id_equipe} value={row.id_equipe}>{row.nome} · sessão #{row.id_sessao}</option>)}</select></label><span className={styles.badge}>{label(team?.status)}</span></div>}<UnitMore list={teams} /></div></section>
    {team && <><section className={styles.panel} aria-labelledby="team-details-title"><div className={styles.panelHeader}><div><h2 id="team-details-title">{team.nome}</h2><p>Sessão #{team.id_sessao} · Equipe #{team.id_equipe}</p></div>{supervisor && team.status === 'ATIVA' && <button type="button" className={styles.iconButton} aria-label="Editar nome da equipe" title="Editar nome" onClick={() => setEditing(value => !value)}>{editing ? <X size={17} /> : <Pencil size={17} />}</button>}</div><div className={styles.body}>{editing && supervisor && <form className={styles.form} onSubmit={rename}><label>Novo nome<input name="nome" defaultValue={team.nome} maxLength={100} required /></label><button type="submit" className={styles.button} disabled={actions.pending}>Salvar</button></form>}
      {invite && <div className={styles.detail}><strong>Convite para esta equipe</strong><p className={styles.muted}>Função: {invite.funcao_proposta} · recebido em {dateTime(invite.criado_em)}</p><div className={styles.row}><button type="button" className={styles.button} disabled={actions.pending} onClick={() => actions.run(`/${teamId}/entries/${invite.id_entrada}/decision`, { method: 'POST', body: { decision: 'ACEITAR' } }, 'Convite aceito.')}><Check size={16} />Aceitar convite</button><button type="button" className={styles.secondary} disabled={actions.pending} onClick={() => actions.run(`/${teamId}/entries/${invite.id_entrada}/decision`, { method: 'POST', body: { decision: 'RECUSAR' } }, 'Convite recusado.')}>Recusar</button></div></div>}
      {supervisor && team.status === 'ATIVA' && <details className={styles.detail}><summary>Convidar colaborador</summary><form className={styles.form} onSubmit={inviteUser}><label>E-mail do colaborador<input name="email" type="email" maxLength={150} required placeholder="colaborador@exemplo.com" /></label><label>Função na equipe<input name="funcao" maxLength={100} required placeholder="Ex.: Atendimento" /></label><button type="submit" className={styles.button} disabled={lookingUp || actions.pending}><UserRoundPlus size={16} />{lookingUp ? 'Localizando…' : 'Enviar convite'}</button></form></details>}
      <h3 className={styles.muted}>Membros da equipe</h3>{!invite && <UnitListState list={members} empty="Nenhum membro cadastrado nesta equipe." />}{members.items.length > 0 && <ul className={styles.list}>{members.items.map(row => <li key={row.id_equipe_membro}><div><strong>Colaborador #{row.id_usuario}</strong><small>{row.funcao || 'Sem função'} · desde {row.data_entrada || '—'}</small></div><div className={styles.row}><span className={styles.badge}>{label(row.status)}</span>{supervisor && row.status === 'ATIVO' && <button type="button" className={styles.iconButton} title="Alterar função" aria-label={`Alterar função do colaborador ${row.id_usuario}`} onClick={() => setEditingMember(row)}><Pencil size={16} /></button>}</div></li>)}</ul>}{editingMember && supervisor && <form className={`${styles.form} ${styles.detail}`} onSubmit={updateMember}><label>Função do colaborador #{editingMember.id_usuario}<input name="funcao" defaultValue={editingMember.funcao ?? ''} maxLength={100} required /></label><button type="submit" className={styles.button} disabled={actions.pending}>Salvar função</button><button type="button" className={styles.secondary} onClick={() => setEditingMember(null)}>Cancelar</button></form>}<UnitMore list={members} /></div></section>
    {supervisor && <section className={styles.panel} aria-labelledby="entries-title"><div className={styles.panelHeader}><div><h2 id="entries-title">Convites e solicitações</h2><p>Acompanhe as entradas desta equipe.</p></div></div><div className={styles.body}><UnitListState list={entries} empty="Nenhuma entrada registrada." />{entries.items.length > 0 && <ul className={styles.list}>{entries.items.map(row => <li key={row.id_entrada}><div><strong>{label(row.tipo)} · colaborador #{row.id_usuario}</strong><small>{row.funcao_proposta || 'Função pendente'} · {dateTime(row.criado_em)}</small></div><span className={styles.badge}>{label(row.status)}</span>{row.tipo === 'SOLICITACAO' && row.status === 'PENDENTE' && <form className={`${styles.form} ${styles.full}`} onSubmit={event => decideRequest(event, row)}><label>Função<input name="funcao" maxLength={100} required /></label><button type="submit" className={styles.button} disabled={actions.pending}>Aceitar</button><button type="button" className={styles.secondary} disabled={actions.pending} onClick={() => actions.run(`/${teamId}/entries/${row.id_entrada}/decision`, { method: 'POST', body: { decision: 'RECUSAR' } }, 'Solicitação recusada.')}>Recusar</button></form>}</li>)}</ul>}<UnitMore list={entries} /></div></section>}</>}
  </UnitLayout>;
}
