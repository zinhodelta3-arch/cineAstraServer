'use client';

import { useState } from 'react';
import { Pencil, Plus, UserRoundMinus, UserRoundPlus, X } from 'lucide-react';
import { useSession } from '@/hooks/auth/use-session';
import { useUnitAction, useUnitContext, useUnitList, useUnitTeam } from '@/hooks/unit/use-unit-data';
import { teamSchedule } from '@/lib/team-schedule.mjs';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import Link from 'next/link';
import UnitJoinRequests from './unit-join-requests';
import UnitCollaboratorAccounts from './unit-collaborator-accounts';
import styles from './unit.module.css';

export default function UnitTeams({entryId}) {
  const { user } = useSession();
  const supervisor = user?.role === 'SUPERVISOR';
  const context = useUnitContext();
  const { teams, teamId, setTeamId, team } = useUnitTeam();
  const assigned = supervisor && context.locations.length>0;
  const sessions = useUnitList(assigned ? '/eligible-sessions?limit=20' : null);
  const entries = useUnitList(team ? `/${teamId}/entries?limit=100${entryId?`&entryId=${entryId}`:''}` : null);
  const invite = entries.items.find(row => row.tipo === 'CONVITE' && row.status === 'PENDENTE' && row.id_usuario === user?.id);
  const canReadMembers = team && (supervisor || team.myFunction?.trim() || entries.data && !invite);
  const members = useUnitList(canReadMembers ? `/${teamId}/members?limit=100` : null);
  const canManage = supervisor && team?.status === 'ATIVA' && team.sessionOpen && team.id_supervisor===user.id;
  const [editing, setEditing] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingMember,setRemovingMember]=useState(null);
  const actions = useUnitAction(() => { teams.reload(); entries.reload(); members.reload(); sessions.reload(); });

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
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const funcao = String(data.get('funcao') ?? '').trim();
    if (!email || email.length > 150 || !funcao || funcao.length > 100) return actions.setError('Informe o e-mail do colaborador e sua função.');
    if(await actions.run(`/${teamId}/entries/invitations`,{method:'POST',body:{email,funcao}},'Convite enviado.'))form.reset();
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
    <div className={styles.teamSections}>
    {entryId&&<Link href="/unidade/equipes" prefetch={false} className={styles.secondary}>Ver todas as entradas</Link>}
    {user?.role === 'COLABORADOR' && <UnitJoinRequests entryId={entryId} onRefresh={()=>{teams.reload();entries.reload();members.reload();}} />}
    {supervisor&&!context.loading&&!context.error&&!assigned&&<p className={styles.message}>Você ainda está sem cinema vinculado. Peça ao administrador para atribuir uma unidade e liberar a criação de equipes.</p>}
    {assigned&&<section className={`${styles.panel} ${styles.ticket}`} aria-labelledby="new-team-title">
      <header className={styles.panelHeader}><div><h2 id="new-team-title">Nova equipe</h2><p>A equipe atua do início ao fim da sessão selecionada.</p></div></header>
      <div className={styles.body}>
        {sessions.items.length>0&&<form className={styles.form} onSubmit={create}>
          <label>Sessão<select name="sessionId" required disabled={actions.pending}><option value="">Selecione uma sessão</option>
            {sessions.items.map(row=><option key={row.id_sessao} value={row.id_sessao}>{row.titulo_filme} · {teamSchedule({date:row.data,start:row.horario_inicio,end:row.horario_fim})} · {row.nome_sala}</option>)}
          </select></label>
          <label>Nome da equipe<input name="nome" maxLength={100} required placeholder="Ex.: Operação da sessão" /></label>
          <button type="submit" className={styles.button} disabled={actions.pending}><Plus size={16} aria-hidden="true" />Criar equipe</button>
        </form>}
        <UnitListState list={sessions} empty="Nenhuma sessão vigente sem equipe neste cinema. Consulte a programação em Sessões." />
        {sessions.items.length>0&&<UnitMore list={sessions} noun="sessões disponíveis" />}
      </div>
    </section>}
    <section className={styles.panel} aria-labelledby="teams-title"><div className={styles.panelHeader}><div><h2 id="teams-title">Equipes vinculadas</h2><p>{supervisor ? 'Equipes do seu cinema.' : 'Equipes em que você atua ou recebeu um convite.'}</p></div><span className={styles.badge}>{teams.items.length} carregadas</span></div><div className={styles.body}><UnitListState list={teams} empty={supervisor ? 'Nenhuma equipe cadastrada neste cinema.' : 'Você ainda não participa de uma equipe nem recebeu convites.'} />{teams.items.length > 0 && <div className={styles.toolbar}><label className={styles.field}>Equipe<select className={styles.select} value={teamId} disabled={actions.pending} onChange={event => { setTeamId(event.target.value); setEditing(false); setEditingMember(null); setRemovingMember(null); }}>{team && !teams.items.some(row => row.id_equipe === teamId) && <option value={teamId}>{team.nome} · {teamSchedule(team.schedule)}</option>}{teams.items.map(row => <option key={row.id_equipe} value={row.id_equipe}>{row.nome} · {teamSchedule(row.schedule)}</option>)}</select></label><span className={styles.badge}>{label(team?.status)}</span></div>}<UnitMore list={teams} /></div></section>
    {assigned&&<UnitCollaboratorAccounts teamId={canManage?teamId:null} teamName={team?.nome} onChange={()=>{members.reload();entries.reload();}} />}
    {team && <><section className={styles.panel} aria-labelledby="team-details-title"><div className={styles.panelHeader}><div><h2 id="team-details-title">{team.nome}</h2><p>{team.location?.name && `${team.location.name} · `}{teamSchedule(team.schedule)}</p></div>{canManage && <button type="button" className={styles.iconButton} aria-label="Editar nome da equipe" title="Editar nome" onClick={() => setEditing(value => !value)}>{editing ? <X size={17} /> : <Pencil size={17} />}</button>}</div><div className={styles.body}>{editing && canManage && <form className={styles.form} onSubmit={rename}><label>Novo nome<input name="nome" defaultValue={team.nome} maxLength={100} required /></label><button type="submit" className={styles.button} disabled={actions.pending}>Salvar</button></form>}
      {supervisor&&team.id_supervisor!==user.id&&<p className={styles.muted}>Somente o responsável pela equipe ou um administrador pode alterar a equipe e decidir suas entradas.</p>}
      {canManage && <details className={styles.detail}><summary>Convidar colaborador</summary><form className={styles.form} onSubmit={inviteUser}><label>E-mail do colaborador<input name="email" type="email" maxLength={150} required placeholder="colaborador@exemplo.com" /></label><label>Função na equipe<input name="funcao" maxLength={100} required placeholder="Ex.: Atendimento" /></label><button type="submit" className={styles.button} disabled={actions.pending}><UserRoundPlus size={16} />{actions.pending ? 'Enviando…' : 'Enviar convite'}</button></form></details>}
      <h3 className={styles.muted}>Membros da equipe</h3>
      {canReadMembers&&<UnitListState list={members} empty="Nenhum membro cadastrado nesta equipe." />}
      {members.items.length>0&&<ul className={styles.list}>{members.items.map(row=><li key={row.id_equipe_membro}>
        <div><strong>{row.name??`Colaborador #${row.id_usuario}`}</strong>
          <small>{row.funcao||'Sem função'} · desde {row.data_entrada||'—'}</small></div>
        <div className={styles.row}>
          <span className={styles.badge}>{label(row.status)}</span>
          {canManage&&row.status==='ATIVO'&&<>
            <button type="button" className={styles.iconButton} title="Alterar função" aria-label={`Alterar função de ${row.name??row.id_usuario}`}
              onClick={()=>{setRemovingMember(null);setEditingMember(row);}}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" className={styles.iconButton} title="Remover da equipe" aria-label={`Remover ${row.name??row.id_usuario} da equipe`}
              onClick={()=>{setEditingMember(null);setRemovingMember(row);}}><UserRoundMinus size={16} aria-hidden="true" /></button>
          </>}
        </div>
      </li>)}</ul>}
      {editingMember&&canManage&&<form key={editingMember.id_equipe_membro} className={`${styles.form} ${styles.detail}`} onSubmit={updateMember}>
        <label>Função de {editingMember.name??`#${editingMember.id_usuario}`}<input name="funcao" defaultValue={editingMember.funcao??''} maxLength={100} required /></label>
        <button type="submit" className={styles.button} disabled={actions.pending}>Salvar função</button>
        <button type="button" className={styles.secondary} onClick={()=>setEditingMember(null)}>Cancelar</button>
      </form>}
      {removingMember&&canManage&&<div className={styles.detail}>
        <strong>Remover {removingMember.name??'colaborador'} da equipe?</strong>
        <p className={styles.muted}>O vínculo será encerrado nesta equipe. Para voltar, o colaborador precisará de um novo ingresso.</p>
        <div className={styles.row}>
          <button type="button" className={styles.secondary} disabled={actions.pending} onClick={()=>setRemovingMember(null)}>Voltar</button>
          <button type="button" className={styles.button} disabled={actions.pending} onClick={async()=>{
            if(await actions.run(`/${teamId}/members/${removingMember.id_equipe_membro}`,{method:'DELETE'},'Membro removido da equipe.'))setRemovingMember(null);
          }}>Confirmar remoção</button>
        </div>
      </div>}
      {canReadMembers&&members.items.length>0&&<UnitMore list={members} noun="membros" />}
      </div></section>
    {supervisor && <section className={styles.panel} aria-labelledby="entries-title"><div className={styles.panelHeader}><div><h2 id="entries-title">Convites e solicitações</h2><p>Acompanhe as entradas desta equipe.</p></div></div><div className={styles.body}><UnitListState list={entries} empty="Nenhuma entrada registrada." />{entries.items.length > 0 && <ul className={styles.list}>{entries.items.map(row => <li key={row.id_entrada}><div><strong>{label(row.tipo)} · colaborador #{row.id_usuario}</strong><small>{row.funcao_proposta || 'Função pendente'} · {dateTime(row.criado_em)}</small></div><span className={styles.badge}>{label(row.status)}</span>{canManage && team.id_supervisor === user.id && row.tipo === 'SOLICITACAO' && row.status === 'PENDENTE' && <form className={`${styles.form} ${styles.full}`} onSubmit={event => decideRequest(event, row)}><label>Função<input name="funcao" defaultValue={row.funcao_proposta ?? ''} maxLength={100} required /></label><button type="submit" className={styles.button} disabled={actions.pending}>Aceitar</button><button type="button" className={styles.secondary} disabled={actions.pending} onClick={() => actions.run(`/${teamId}/entries/${row.id_entrada}/decision`, { method: 'POST', body: { decision: 'RECUSAR' } }, 'Solicitação recusada.')}>Recusar</button></form>}</li>)}</ul>}<UnitMore list={entries} /></div></section>}</>}
    </div>
  </UnitLayout>;
}
