'use client';

import { useState } from 'react';
import { Check, Pencil, Play, Plus, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import UnitSessionForm from './unit-session-form';
import styles from './unit.module.css';

export default function UnitSessions({canManage=false}) {
  const context = useUnitContext();
  const localId = context.locations[0]?.id_local;
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null);
  const params = new URLSearchParams({ limit: '20' });
  if(localId)params.set('localId',localId);
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const sessions = useUnitList(localId ? `/sessions?${params}` : null, unitOperation);
  const action = useUnitAction(sessions.reload, unitOperation);
  const item = dialog?.item;
  const trailerMinutes = sessions.data?.trailerMinutes;

  function openDialog(value) { action.setError(''); setDialog(value); }

  async function transition(next) {
    const path = `/sessions/${item.id_sessao}`;
    const options = next === 'CANCELADA' ? { method: 'DELETE' } : { method: 'PATCH', body: { status: next } };
    if (await action.run(path, options, next === 'CANCELADA' ? 'Sessão cancelada.' : 'Estado da sessão atualizado.')) setDialog(null);
  }
  return <UnitLayout title="Sessões da unidade" description="Programe filmes e acompanhe as exibições deste cinema." location={context.locations[0]?.nome}>
    <UnitFeedback error={context.error || (!dialog && action.error)} notice={action.notice} />
    <div className={styles.toolbar}>
      <label className={styles.field}>Data<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      <label className={styles.field}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{['AGENDADA', 'EM_CARTAZ', 'ENCERRADA', 'CANCELADA'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      {canManage&&<button type="button" className={styles.button} onClick={() => openDialog({ type: 'form' })} disabled={!localId || !Number.isInteger(trailerMinutes)}><Plus size={16} />Nova sessão</button>}
    </div>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Programação</h2><p>{context.loading ? 'Identificando cinema…' : context.locations[0]?.nome}</p></div><span className={styles.badge}>{sessions.items.length} carregadas</span></div>
      <div className={styles.body}><UnitListState list={sessions} empty="Nenhuma sessão encontrada." />{sessions.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Filme</th><th>Sala</th><th>Data e horário</th><th>Idioma</th><th>Preço</th><th>Estado</th>{canManage&&<th>Ações</th>}</tr></thead><tbody>{sessions.items.map(row => <tr key={row.id_sessao}><th scope="row">{row.titulo_filme}</th><td>{row.nome_sala}</td><td>{row.data?.slice(0, 10)}<small>{row.horario_inicio?.slice(0, 5)}–{row.horario_fim?.slice(0, 5)}</small></td><td>{label(row.idioma)}</td><td>R$ {Number(row.preco_inteira).toFixed(2).replace('.', ',')}</td><td><span className={styles.badge}>{label(row.status)}</span></td>{canManage&&<td><div className={styles.actionRow}><button type="button" className={styles.iconButton} title="Editar sessão" aria-label={`Editar sessão ${row.id_sessao}`} disabled={row.status !== 'AGENDADA'} onClick={() => openDialog({ type: 'form', item: row })}><Pencil size={16} /></button>{row.status === 'AGENDADA' && <button type="button" className={styles.iconButton} title="Colocar em cartaz" aria-label={`Colocar sessão ${row.id_sessao} em cartaz`} onClick={() => openDialog({ type: 'transition', item: row, next: 'EM_CARTAZ' })}><Play size={16} /></button>}{row.status === 'EM_CARTAZ' && <button type="button" className={styles.iconButton} title="Encerrar" aria-label={`Encerrar sessão ${row.id_sessao}`} onClick={() => openDialog({ type: 'transition', item: row, next: 'ENCERRADA' })}><Check size={16} /></button>}{['AGENDADA', 'EM_CARTAZ'].includes(row.status) && <button type="button" className={styles.iconButton} title="Cancelar" aria-label={`Cancelar sessão ${row.id_sessao}`} onClick={() => openDialog({ type: 'transition', item: row, next: 'CANCELADA' })}><XCircle size={16} /></button>}</div></td>}</tr>)}</tbody></table></div>}<UnitMore list={sessions} /></div>
    </section>
    <Dialog open={canManage&&Boolean(dialog)} onOpenChange={open => { if (!open && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle>{dialog?.type === 'transition' ? `${label(dialog.next)} sessão` : item ? 'Editar sessão' : 'Nova sessão'}</DialogTitle><DialogDescription>{dialog?.type === 'transition' ? `${item?.titulo_filme} · ${item?.data?.slice(0, 10)} às ${item?.horario_inicio?.slice(0, 5)}` : 'Escolha um filme ativo e uma sala ativa deste cinema.'}</DialogDescription>
      {dialog?.type === 'form' && <UnitSessionForm key={item?.id_sessao ?? 'new'} item={item} localId={localId} trailerMinutes={trailerMinutes} action={action} onClose={() => setDialog(null)} />}
      {dialog?.type === 'transition' && <div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="button" className={styles.button} disabled={action.pending} onClick={() => transition(dialog.next)}>{action.pending ? 'Aguarde…' : 'Confirmar'}</button></div>}
      {action.error && <p className={`${styles.message} ${styles.error}`} role="alert">{action.error}</p>}
    </DialogContent></Dialog>
  </UnitLayout>;
}
