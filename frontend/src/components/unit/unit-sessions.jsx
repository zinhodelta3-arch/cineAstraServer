'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, Check, CircleStop, ClipboardList, Pencil, Play, Plus, Ticket, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import UnitSessionForm from './unit-session-form';
import SessionContext, { sessionHref, useSessionContext } from '@/components/session-context/session-context';
import styles from './unit.module.css';

const statuses = ['AGENDADA','ATRASADA','EM_CARTAZ','EXPIRADA','INTERROMPIDA','ENCERRADA','CANCELADA'];
const transitions = {
  AGENDADA: ['EM_CARTAZ','CANCELADA'],
  ATRASADA: ['EM_CARTAZ','CANCELADA'],
  EM_CARTAZ: ['ENCERRADA','INTERROMPIDA','CANCELADA'],
  EXPIRADA: ['CANCELADA'],
  INTERROMPIDA: ['CANCELADA'],
  ENCERRADA: ['archive'],
  CANCELADA: ['archive'],
};
const actions = {
  EM_CARTAZ: { icon:Play, title:'Colocar em cartaz', message:'Sessão em cartaz.' },
  ENCERRADA: { icon:Check, title:'Encerrar sessão', message:'Sessão encerrada.' },
  INTERROMPIDA: { icon:CircleStop, title:'Interromper sessão', message:'Sessão interrompida.' },
  CANCELADA: { icon:XCircle, title:'Cancelar sessão', message:'Sessão cancelada.' },
  archive: { icon:Archive, title:'Arquivar sessão', message:'Sessão arquivada.' },
};

function SessionRow({ row, canManage, open }) {
  const status = row.status_operacional ?? row.status;
  return <tr>
    <th scope="row">{row.titulo_filme}</th>
    <td>{row.nome_sala}</td>
    <td>{row.data?.slice(0, 10)}<small>{row.horario_inicio?.slice(0, 5)}–{row.horario_fim?.slice(0, 5)}</small></td>
    <td>{label(row.idioma)}</td>
    <td>R$ {Number(row.preco_inteira).toFixed(2).replace('.', ',')}</td>
    <td><span className={styles.badge}>{label(status)}</span></td>
    <td><div className={styles.actionRow}>
      {row.can_consult !== false && <>
        <Link prefetch={false} className={styles.iconButton} href={sessionHref('unit','tickets',row)} title="Ingressos e pedidos" aria-label={`Ingressos · ${row.titulo_filme}`}><Ticket size={16} /></Link>
        <Link prefetch={false} className={styles.iconButton} href={sessionHref('unit','presence',row)} title="Ver presença" aria-label={`Presença · ${row.titulo_filme}`}><ClipboardList size={16} /></Link>
      </>}
      {canManage && row.status === 'AGENDADA' && <button type="button" className={styles.iconButton}
        title="Editar sessão" aria-label={`Editar sessão de ${row.titulo_filme}`}
        onClick={() => open({ type:'form', item:row })}><Pencil size={16} /></button>}
      {canManage && !row.arquivada_em && transitions[status]?.map(next => {
        const { icon:Icon, title } = actions[next];
        return <button type="button" key={next} className={styles.iconButton} title={title}
          aria-label={`${title} · ${row.titulo_filme}`}
          onClick={() => open({ type:'transition', item:row, next })}><Icon size={16} /></button>;
      })}
    </div></td>
  </tr>;
}

export default function UnitSessions({ canManage = false }) {
  const context = useUnitContext();
  const selection = useSessionContext(unitOperation, '/');
  const local = context.locations.find(item => item.id_local === selection.localId) ?? context.locations[0];
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [visibilityChoice, setVisibility] = useState(null);
  const visibility = visibilityChoice ?? (selection.session?.arquivada_em ? 'archived' : 'programming');
  const [dialog, setDialog] = useState(null);
  const params = new URLSearchParams({ limit:'20', visibility, localId:local?.id_local ?? '' });
  if (date) params.set('date', date);
  if (status) params.set('operationalStatus', status);
  const sessions = useUnitList(local && !selection.loading ? `/sessions?${params}` : null, unitOperation);
  const action = useUnitAction(sessions.reload, unitOperation);
  const item = dialog?.item;
  const next = dialog?.next;
  const trailerMinutes = sessions.data?.trailerMinutes;
  const open = value => {
    action.setError('');
    setDialog(value);
  };
  const close = () => setDialog(null);

  async function transition() {
    const path = `/sessions/${item.id_sessao}`;
    const [endpoint, options] = {
      archive: [`${path}/archive`, { method:'POST', body:{} }],
      CANCELADA: [path, { method:'DELETE' }],
    }[next] ?? [path, { method:'PATCH', body:{ status:next } }];
    if (await action.run(endpoint, options, actions[next].message)) close();
  }

  return <UnitLayout title="Sessões da unidade" description="Programe filmes e acompanhe as exibições deste cinema." location={local?.nome}>
    <SessionContext selection={selection} area="unit" active="sessions" />
    <UnitFeedback error={context.error || (!dialog && action.error)} notice={action.notice} />
    <div className={styles.toolbar}>
      <label className={styles.field}>Data<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      <label className={styles.field}>Estado<select value={status} onChange={event => setStatus(event.target.value)}>
        <option value="">Todos</option>
        {(visibility === 'archived' ? ['ENCERRADA','CANCELADA'] : statuses).map(value => <option key={value} value={value}>{label(value)}</option>)}
      </select></label>
      <label className={styles.field}>Exibir<select value={visibility} onChange={event => {
        setVisibility(event.target.value);
        setStatus('');
      }}><option value="programming">Programação</option><option value="archived">Arquivo</option></select></label>
      {canManage && visibility === 'programming' && <button type="button" className={styles.button}
        onClick={() => open({ type:'form' })} disabled={!local || !Number.isInteger(trailerMinutes)}><Plus size={16} />Nova sessão</button>}
    </div>
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{visibility === 'archived' ? 'Sessões arquivadas' : 'Programação'}</h2>
      </div>
      <div className={styles.body}>
        <UnitListState list={sessions} empty={visibility === 'archived' ? 'Nenhuma sessão arquivada encontrada.' : 'Nenhuma sessão encontrada.'} />
        {sessions.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>Filme</th><th>Sala</th><th>Data e horário</th><th>Idioma</th><th>Preço</th><th>Estado</th><th>Ações</th></tr></thead>
          <tbody>{sessions.items.map(row => <SessionRow key={row.id_sessao} row={row} canManage={canManage} open={open} />)}</tbody>
        </table></div>}
        <UnitMore list={sessions} />
      </div>
    </section>
    <Dialog open={canManage && Boolean(dialog)} onOpenChange={visible => { if (!visible && !action.pending) close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>{next ? actions[next].title : item ? 'Editar sessão' : 'Nova sessão'}</DialogTitle>
        <DialogDescription>{next ? `${item.titulo_filme} · ${item.data?.slice(0, 10)} às ${item.horario_inicio?.slice(0, 5)}` : 'Escolha um filme da oferta e uma sala deste cinema.'}</DialogDescription>
        {dialog?.type === 'form' && <UnitSessionForm key={item?.id_sessao ?? 'new'} item={item} localId={local?.id_local} trailerMinutes={trailerMinutes} action={action} onClose={close} />}
        {next && <>
          {['CANCELADA','INTERROMPIDA'].includes(next) && <p>As vendas serão suspensas. Pagamentos efetuados seguem para análise de reembolso.</p>}
          {next === 'archive' && <p>A sessão ficará disponível no Arquivo com seu histórico.</p>}
          <div className={styles.row}>
            <button type="button" className={styles.secondary} onClick={close} disabled={action.pending}>Voltar</button>
            <button type="button" className={styles.button} disabled={action.pending} onClick={transition}>
              {action.pending ? 'Aguarde…' : actions[next].title}
            </button>
          </div>
        </>}
        {action.error && <p className={`${styles.message} ${styles.error}`} role="alert">{action.error}</p>}
      </DialogContent>
    </Dialog>
  </UnitLayout>;
}
