'use client';

import { useEffect, useState } from 'react';
import { Check, CheckCheck, CircleCheck, ListChecks, Pencil, Plus, UserRoundCheck, X, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useSession } from '@/hooks/auth/use-session';
import { useUnitAction, useUnitContext, useUnitList, useUnitTeam } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, dateTime, label } from './unit-layout';
import styles from './unit.module.css';

const statuses = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO', 'CANCELADO'];
const priorities = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];

export default function UnitTasks() {
  const { user } = useSession();
  const supervisor = user?.role === 'SUPERVISOR';
  const context = useUnitContext();
  const { teams, teamId, setTeamId, team } = useUnitTeam();
  const [status, setStatus] = useState('');
  const [assignedOnly, setAssignedOnly] = useState(false);
  useEffect(() => { setAssignedOnly(new URLSearchParams(window.location.search).get('assigned') === 'me'); }, []);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const list = useUnitList(teamId ? `/${teamId}/chamados?limit=20${assignedOnly ? '&assigned=me' : ''}${status ? `&status=${status}` : ''}` : null);
  const members = useUnitList(supervisor && teamId ? `/${teamId}/members?limit=100` : null);
  const actions = useUnitAction(list.reload);
  const canWrite = Boolean(teamId && team?.status === 'ATIVA' && !list.loading && !list.error);

  async function save(event) {
    event.preventDefault();
    if (!canWrite) return actions.setError('Selecione uma equipe ativa em que você possa abrir chamados.');
    const form = event.currentTarget;
    const data = new FormData(form);
    const titulo = String(data.get('titulo') ?? '').trim();
    const descricao = String(data.get('descricao') ?? '').trim() || null;
    const prioridade = String(data.get('prioridade') ?? 'MEDIA');
    if (!titulo || titulo.length > 200 || (descricao?.length ?? 0) > 10000 || !priorities.includes(prioridade)) return actions.setError('Confira os dados do chamado.');
    if (await actions.run(`/${teamId}/chamados${editing ? `/${editing.id_chamado}` : ''}`, { method: editing ? 'PATCH' : 'POST', body: { titulo, descricao, prioridade } }, editing ? 'Chamado atualizado.' : 'Chamado aberto.')) {
      setFormOpen(false);
      setEditing(null);
      form.reset();
    }
  }

  function openForm(item = null) { setEditing(item); setFormOpen(true); }
  async function assign(event) {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get('userId') ?? '');
    if (!userId) return actions.setError('Selecione um colaborador ativo.');
    if (await actions.run(`/${teamId}/chamados/${assigning.id_chamado}/assign`, { method: 'POST', body: { userId } }, 'Responsável atribuído.')) setAssigning(null);
  }
  const canEdit = row => row.status === 'ABERTO' && (supervisor || row.id_criador === user?.id);
  const canClose = row => row.status === 'RESOLVIDO' && (supervisor || row.id_criador === user?.id || row.id_responsavel === user?.id);
  const canCancel = row => supervisor && row.status === 'ABERTO' && row.id_responsavel == null;

  function confirmAction(type, row) {
    actions.setError('');
    setConfirmation({ type, row });
  }

  async function finishTask() {
    const { type, row } = confirmation;
    const cancel = type === 'cancel';
    const path = `/${row.id_equipe}/chamados/${row.id_chamado}`;
    if (await actions.run(cancel ? path : `${path}/close`, { method: cancel ? 'DELETE' : 'POST' }, cancel ? 'Chamado cancelado. O histórico foi preservado.' : 'Chamado fechado.')) {
      setConfirmation(null);
    }
  }

  return <UnitLayout title="Chamados" description="Registre e acompanhe o trabalho operacional da sua equipe." location={context.locations.map(row => row.nome).join(' · ')}>
    <UnitFeedback error={(!confirmation && actions.error) || context.error} notice={actions.notice} />
    <section className={styles.panel} aria-labelledby="tasks-title"><div className={styles.panelHeader}><div><h2 id="tasks-title">Chamados da equipe</h2><p>Os colaboradores editam seus próprios chamados e acompanham a resolução.</p></div><button type="button" className={styles.button} onClick={() => openForm()} disabled={!canWrite || actions.pending}><Plus size={16} />Novo chamado</button></div><div className={styles.body}>
      <div className={styles.toolbar}><label className={`${styles.field} ${styles.selector}`}>Equipe<select className={styles.select} value={teamId} onChange={event => { setTeamId(event.target.value); setEditing(null); setAssigning(null); setFormOpen(false); }} disabled={!teams.items.length && !team}>{team && !teams.items.some(row => row.id_equipe === teamId) && <option value={teamId}>{team.nome} · sessão #{team.id_sessao}</option>}{teams.items.map(row => <option key={row.id_equipe} value={row.id_equipe}>{row.nome} · sessão #{row.id_sessao}</option>)}</select></label><label className={styles.field}><span><input type="checkbox" checked={assignedOnly} onChange={event => setAssignedOnly(event.target.checked)} /> Atribuídos a mim</span></label><label className={styles.field}>Status<select className={styles.select} value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label></div>
      <UnitListState list={teams} empty="Você ainda não tem equipes vinculadas. Solicite ingresso ou aceite um convite na página Equipes." />
      {teamId && <><UnitListState list={list} empty="Nenhum chamado encontrado nesta equipe." />{list.items.length > 0 && <ul className={styles.list}>{list.items.map(row => <li key={row.id_chamado}><div><strong>{row.titulo}</strong><small>#{row.id_chamado} · {label(row.prioridade)} · aberto em {dateTime(row.data_abertura)}</small>{row.descricao && <p className={styles.muted}>{row.descricao}</p>}</div><div className={styles.row}><span className={styles.badge}>{label(row.status)}</span>{team?.status === 'ATIVA' && <div className={styles.actionRow}>
        {canEdit(row) && <button type="button" className={styles.iconButton} title="Editar chamado" aria-label={`Editar chamado ${row.titulo}`} onClick={() => openForm(row)}><Pencil size={16} /></button>}
        {supervisor && row.status === 'ABERTO' && <button type="button" className={styles.iconButton} title="Atribuir responsável" aria-label={`Atribuir chamado ${row.titulo}`} onClick={() => setAssigning(row)}><UserRoundCheck size={16} /></button>}
        {!supervisor && row.status === 'ABERTO' && (!row.id_responsavel || row.id_responsavel === user?.id) && <button type="button" className={styles.iconButton} title="Aceitar chamado" aria-label={`Aceitar chamado ${row.titulo}`} disabled={actions.pending} onClick={() => actions.run(`/${teamId}/chamados/${row.id_chamado}/accept`, { method: 'POST' }, 'Chamado aceito.')}><Check size={16} /></button>}
        {!supervisor && row.status === 'EM_ANDAMENTO' && row.id_responsavel === user?.id && <button type="button" className={styles.iconButton} title="Marcar como resolvido" aria-label={`Resolver chamado ${row.titulo}`} disabled={actions.pending} onClick={() => actions.run(`/${teamId}/chamados/${row.id_chamado}/resolve`, { method: 'POST' }, 'Chamado resolvido.')}><CircleCheck size={16} /></button>}
        {canClose(row) && <button type="button" className={styles.iconButton} title="Fechar chamado" aria-label={`Fechar chamado ${row.titulo}`} disabled={actions.pending} onClick={() => confirmAction('close', row)}><CheckCheck size={16} /></button>}
        {canCancel(row) && <button type="button" className={styles.iconButton} title="Cancelar chamado" aria-label={`Cancelar chamado ${row.titulo}`} disabled={actions.pending} onClick={() => confirmAction('cancel', row)}><XCircle size={16} /></button>}
      </div>}</div></li>)}</ul>}<UnitMore list={list} /></>}
      <UnitMore list={teams} />
    </div></section>
    <Dialog open={Boolean(confirmation)} onOpenChange={open => { if (!open && !actions.pending) { actions.setError(''); setConfirmation(null); } }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>{confirmation?.type === 'cancel' ? 'Cancelar chamado' : 'Fechar chamado'} #{confirmation?.row.id_chamado}</DialogTitle>
        <DialogDescription>{confirmation?.row.titulo}. O histórico permanece disponível.</DialogDescription>
        <UnitFeedback error={actions.error} />
        <div className={styles.row}>
          <button type="button" className={styles.secondary} disabled={actions.pending} onClick={() => { actions.setError(''); setConfirmation(null); }}>Voltar</button>
          <button type="button" className={styles.button} disabled={actions.pending} onClick={finishTask}>{actions.pending ? 'Salvando…' : 'Confirmar'}</button>
        </div>
      </DialogContent>
    </Dialog>
    {assigning && supervisor && <section className={`${styles.panel} ${styles.ticket}`} aria-labelledby="assign-title"><div className={styles.panelHeader}><h2 id="assign-title">Atribuir chamado #{assigning.id_chamado}</h2><button type="button" className={styles.iconButton} aria-label="Fechar atribuição" onClick={() => setAssigning(null)}><X size={17} /></button></div><div className={styles.body}><form className={styles.form} onSubmit={assign}><label>Colaborador ativo<select name="userId" required defaultValue={assigning.id_responsavel ?? ''}><option value="">Selecione</option>{members.items.filter(row => row.status === 'ATIVO' && row.funcao?.trim()).map(row => <option key={row.id_equipe_membro} value={row.id_usuario}>Colaborador #{row.id_usuario} · {row.funcao}</option>)}</select></label><button type="submit" className={styles.button} disabled={actions.pending || !members.items.length}>Atribuir</button></form><UnitListState list={members} empty="Nenhum colaborador ativo com função nesta equipe." /><UnitMore list={members} /></div></section>}
    {formOpen && <section className={`${styles.panel} ${styles.ticket}`} aria-labelledby="task-form-title"><div className={styles.panelHeader}><h2 id="task-form-title">{editing ? 'Editar chamado' : 'Novo chamado'}</h2><button type="button" className={styles.iconButton} aria-label="Fechar formulário" onClick={() => { setFormOpen(false); setEditing(null); }}><X size={17} /></button></div><div className={styles.body}><form key={editing?.id_chamado ?? 'new'} className={styles.form} onSubmit={save}><label className={styles.full}>Título<input name="titulo" maxLength={200} defaultValue={editing?.titulo ?? ''} required /></label><label className={styles.full}>Descrição<textarea name="descricao" maxLength={10000} defaultValue={editing?.descricao ?? ''} /></label><label>Prioridade<select name="prioridade" defaultValue={editing?.prioridade ?? 'MEDIA'}>{priorities.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><button type="submit" className={styles.button} disabled={actions.pending || !canWrite}><ListChecks size={16} />{actions.pending ? 'Salvando…' : 'Salvar chamado'}</button></form></div></section>}
  </UnitLayout>;
}
