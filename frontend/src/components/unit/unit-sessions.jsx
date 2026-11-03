'use client';

import { useState } from 'react';
import { Check, Pencil, Play, Plus, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import styles from './unit.module.css';

export default function UnitSessions() {
  const context = useUnitContext();
  const localId = context.locations[0]?.id_local;
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null);
  const params = new URLSearchParams({ limit: '20' });
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const sessions = useUnitList(`/sessions?${params}`, unitOperation);
  const films = useUnitList('/films?limit=100&cinema=true', unitOperation);
  const rooms = useUnitList(localId ? `/locations/${localId}/rooms?limit=100&status=ATIVA` : null, unitOperation);
  const action = useUnitAction(sessions.reload, unitOperation);
  const item = dialog?.item;

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get('preco_inteira'));
    if (!Number.isFinite(price) || price < 0 || price > 99999999.99) return action.setError('Informe um preço válido.');
    const body = {
      id_filme: String(form.get('id_filme')), data: String(form.get('data')),
      horario_inicio: String(form.get('horario_inicio')), horario_fim: String(form.get('horario_fim')),
      idioma: String(form.get('idioma')), preco_inteira: price.toFixed(2),
    };
    if (!item) body.id_sala = String(form.get('id_sala'));
    else for (const key of Object.keys(body)) {
      if (body[key] === (key.startsWith('horario_') ? item[key]?.slice(0, 5) : item[key])) delete body[key];
    }
    if (item && !Object.keys(body).length) return action.setError('Nenhuma alteração para salvar.');
    if (await action.run(item ? `/sessions/${item.id_sessao}` : '/sessions', { method: item ? 'PATCH' : 'POST', body }, item ? 'Sessão atualizada.' : 'Sessão agendada.')) setDialog(null);
  }
  async function transition(next) {
    const path = `/sessions/${item.id_sessao}`;
    const options = next === 'CANCELADA' ? { method: 'DELETE' } : { method: 'PATCH', body: { status: next } };
    if (await action.run(path, options, next === 'CANCELADA' ? 'Sessão cancelada.' : 'Estado da sessão atualizado.')) setDialog(null);
  }
  return <UnitLayout title="Sessões da unidade" description="Programe filmes e acompanhe as exibições deste cinema." location={context.locations[0]?.nome}>
    <UnitFeedback error={context.error || action.error} notice={action.notice} />
    <div className={styles.toolbar}>
      <label className={styles.field}>Data<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      <label className={styles.field}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{['AGENDADA', 'EM_CARTAZ', 'ENCERRADA', 'CANCELADA'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      <button type="button" className={styles.button} onClick={() => setDialog({ type: 'form' })} disabled={!localId}><Plus size={16} />Nova sessão</button>
    </div>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Programação</h2><p>{context.loading ? 'Identificando cinema…' : context.locations[0]?.nome}</p></div><span className={styles.badge}>{sessions.items.length} carregadas</span></div>
      <div className={styles.body}><UnitListState list={sessions} empty="Nenhuma sessão encontrada." />{sessions.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Filme</th><th>Sala</th><th>Data e horário</th><th>Idioma</th><th>Preço</th><th>Estado</th><th>Ações</th></tr></thead><tbody>{sessions.items.map(row => <tr key={row.id_sessao}><th scope="row">{row.titulo_filme}</th><td>{row.nome_sala}</td><td>{row.data?.slice(0, 10)}<small>{row.horario_inicio?.slice(0, 5)}–{row.horario_fim?.slice(0, 5)}</small></td><td>{label(row.idioma)}</td><td>R$ {Number(row.preco_inteira).toFixed(2).replace('.', ',')}</td><td><span className={styles.badge}>{label(row.status)}</span></td><td><div className={styles.actionRow}><button type="button" className={styles.iconButton} title="Editar sessão" aria-label={`Editar sessão ${row.id_sessao}`} disabled={row.status !== 'AGENDADA'} onClick={() => setDialog({ type: 'form', item: row })}><Pencil size={16} /></button>{row.status === 'AGENDADA' && <button type="button" className={styles.iconButton} title="Colocar em cartaz" aria-label={`Colocar sessão ${row.id_sessao} em cartaz`} onClick={() => setDialog({ type: 'transition', item: row, next: 'EM_CARTAZ' })}><Play size={16} /></button>}{row.status === 'EM_CARTAZ' && <button type="button" className={styles.iconButton} title="Encerrar" aria-label={`Encerrar sessão ${row.id_sessao}`} onClick={() => setDialog({ type: 'transition', item: row, next: 'ENCERRADA' })}><Check size={16} /></button>}{['AGENDADA', 'EM_CARTAZ'].includes(row.status) && <button type="button" className={styles.iconButton} title="Cancelar" aria-label={`Cancelar sessão ${row.id_sessao}`} onClick={() => setDialog({ type: 'transition', item: row, next: 'CANCELADA' })}><XCircle size={16} /></button>}</div></td></tr>)}</tbody></table></div>}<UnitMore list={sessions} /></div>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={open => { if (!open && !action.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle>{dialog?.type === 'transition' ? `${label(dialog.next)} sessão` : item ? 'Editar sessão' : 'Nova sessão'}</DialogTitle><DialogDescription>{dialog?.type === 'transition' ? `${item?.titulo_filme} · ${item?.data?.slice(0, 10)} às ${item?.horario_inicio?.slice(0, 5)}` : 'Escolha um filme ativo e uma sala ativa deste cinema.'}</DialogDescription>
      {dialog?.type === 'form' && <form key={item?.id_sessao ?? 'new'} className={styles.form} onSubmit={save}><label className={styles.full}>Filme<select name="id_filme" required defaultValue={item?.id_filme ?? ''}><option value="">Selecione</option>{item && !films.items.some(row => row.id_filme === item.id_filme) && <option value={item.id_filme}>{item.titulo_filme}</option>}{films.items.map(row => <option key={row.id_filme} value={row.id_filme}>{row.titulo}</option>)}</select></label>{!item ? <label>Sala<select name="id_sala" required defaultValue=""><option value="">Selecione</option>{rooms.items.map(row => <option key={row.id_sala} value={row.id_sala}>{row.nome} · {row.tipo}</option>)}</select></label> : <p className={styles.muted}>Sala: {item.nome_sala}</p>}<label>Data<input name="data" type="date" required defaultValue={item?.data?.slice(0, 10) ?? ''} /></label><label>Início<input name="horario_inicio" type="time" required defaultValue={item?.horario_inicio?.slice(0, 5) ?? ''} /></label><label>Fim<input name="horario_fim" type="time" required defaultValue={item?.horario_fim?.slice(0, 5) ?? ''} /></label><label>Idioma<select name="idioma" defaultValue={item?.idioma ?? 'DUBLADO'}>{['DUBLADO', 'LEGENDADO', 'ORIGINAL'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><label>Inteira (R$)<input name="preco_inteira" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={item?.preco_inteira ?? ''} /></label><div className={`${styles.row} ${styles.full}`}>{films.nextCursor && <button type="button" className={styles.secondary} onClick={films.loadMore}>Mais filmes</button>}{rooms.nextCursor && <button type="button" className={styles.secondary} onClick={rooms.loadMore}>Mais salas</button>}</div><div className={`${styles.row} ${styles.full}`}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="submit" className={styles.button} disabled={action.pending}>{action.pending ? 'Salvando…' : 'Salvar sessão'}</button></div></form>}
      {dialog?.type === 'transition' && <div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="button" className={styles.button} disabled={action.pending} onClick={() => transition(dialog.next)}>{action.pending ? 'Aguarde…' : 'Confirmar'}</button></div>}
      {action.error && <p className={`${styles.message} ${styles.error}`} role="alert">{action.error}</p>}
    </DialogContent></Dialog>
  </UnitLayout>;
}
