'use client';

import { useState } from 'react';
import { Armchair, Archive, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, label } from './unit-layout';
import styles from './unit.module.css';

const roomTypes = ['2D', '3D', '4DX', 'VIP', 'IMAX'];
const seatTypes = ['COMUM', 'PCD', 'OBESO', 'IDOSO', 'CASAL'];

export default function UnitRooms({canManage=false}) {
  const context = useUnitContext();
  const localId = context.locations[0]?.id_local;
  const [room, setRoom] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [status, setStatus] = useState('');
  const base = localId ? `/locations/${localId}/rooms` : null;
  const rooms = useUnitList(base ? `${base}?limit=20${status ? `&status=${status}` : ''}` : null, unitOperation);
  const seats = useUnitList(base && room ? `${base}/${room.id_sala}/seats?limit=100` : null, unitOperation);
  const roomAction = useUnitAction(rooms.reload, unitOperation);
  const seatAction = useUnitAction(seats.reload, unitOperation);
  const selected = rooms.items.find(value => value.id_sala === room?.id_sala) ?? room;
  const item = dialog?.item;

  async function saveRoom(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const capacity = Number(form.get('capacidade'));
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 2147483647) return roomAction.setError('Capacidade inválida.');
    const body = { nome: String(form.get('nome')).trim(), capacidade: capacity, tipo: String(form.get('tipo')), status: String(form.get('status')) };
    if (item) for (const key of Object.keys(body)) if (body[key] === item[key]) delete body[key];
    if (item && !Object.keys(body).length) return roomAction.setError('Nenhuma alteração para salvar.');
    if (await roomAction.run(item ? `${base}/${item.id_sala}` : base, { method: item ? 'PATCH' : 'POST', body }, 'Sala salva.')) setDialog(null);
  }
  async function saveSeat(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = Number(form.get('numero'));
    if (!Number.isInteger(number) || number < 1 || number > 2147483647) return seatAction.setError('Número do assento inválido.');
    const body = { fileira: String(form.get('fileira')).trim().toUpperCase(), numero: number, tipo: String(form.get('tipo')), status: String(form.get('status')) };
    if (item) for (const key of Object.keys(body)) if (body[key] === item[key]) delete body[key];
    if (item && !Object.keys(body).length) return seatAction.setError('Nenhuma alteração para salvar.');
    const path = `${base}/${selected.id_sala}/seats${item ? `/${item.id_assento}` : ''}`;
    if (await seatAction.run(path, { method: item ? 'PATCH' : 'POST', body }, 'Assento salvo.')) setDialog(null);
  }
  async function archive() {
    const path = dialog.type === 'roomArchive' ? `${base}/${item.id_sala}` : `${base}/${selected.id_sala}/seats/${item.id_assento}`;
    const action = dialog.type === 'roomArchive' ? roomAction : seatAction;
    if (await action.run(path, { method: 'DELETE' }, 'Registro arquivado.')) { setDialog(null); if (dialog.type === 'roomArchive' && selected?.id_sala === item.id_sala) setRoom(null); }
  }

  return <UnitLayout title="Salas e assentos" description="Organize a estrutura física do seu cinema." location={context.locations[0]?.nome}>
    <UnitFeedback error={context.error || roomAction.error || seatAction.error} notice={roomAction.notice || seatAction.notice} />
    <div className={styles.toolbar}><label className={styles.field}>Estado<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{['ATIVA', 'INATIVA', 'MANUTENCAO'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>{canManage&&<button type="button" className={styles.button} disabled={!localId} onClick={() => setDialog({ type: 'roomForm' })}><Plus size={16} />Nova sala</button>}</div>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Salas da unidade</h2><p>Selecione uma sala para consultar os assentos.</p></div></div><div className={styles.body}><UnitListState list={rooms} empty="Nenhuma sala cadastrada." />{rooms.items.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Sala</th><th>Formato</th><th>Capacidade</th><th>Estado</th><th>Ações</th></tr></thead><tbody>{rooms.items.map(row => <tr key={row.id_sala}><th scope="row">{row.nome}</th><td>{row.tipo}</td><td>{row.capacidade}</td><td><span className={styles.badge}>{label(row.status)}</span></td><td><div className={styles.actionRow}><button type="button" className={styles.iconButton} title="Ver assentos" aria-label={`Assentos da sala ${row.nome}`} onClick={() => setRoom(row)}><Armchair size={16} /></button>{canManage&&<button type="button" className={styles.iconButton} title="Editar sala" aria-label={`Editar sala ${row.nome}`} onClick={() => setDialog({ type: 'roomForm', item: row })}><Pencil size={16} /></button>}{canManage&&<button type="button" className={styles.iconButton} title="Arquivar sala" aria-label={`Arquivar sala ${row.nome}`} onClick={() => setDialog({ type: 'roomArchive', item: row })}><Archive size={16} /></button>}</div></td></tr>)}</tbody></table></div>}<UnitMore list={rooms} /></div></section>
    {selected && <section className={`${styles.panel} ${styles.ticket}`}><div className={styles.panelHeader}><div><h2>Assentos · {selected.nome}</h2><p>Ative a sala quando os assentos ativos corresponderem à capacidade.</p></div>{canManage&&<button type="button" className={styles.button} onClick={() => setDialog({ type: 'seatForm' })}><Plus size={16} />Novo assento</button>}</div><div className={styles.body}><UnitListState list={seats} empty="Nenhum assento cadastrado." />{seats.items.length > 0 && <div className={styles.seatGrid}>{seats.items.map(row => <div key={row.id_assento} className={styles.seatCard}><strong>{row.fileira}{row.numero}</strong><small>{label(row.tipo)} · {label(row.status)}</small><div className={styles.actionRow}>{canManage&&<button type="button" className={styles.iconButton} title="Editar assento" aria-label={`Editar assento ${row.fileira}${row.numero}`} onClick={() => setDialog({ type: 'seatForm', item: row })}><Pencil size={15} /></button>}{canManage&&<button type="button" className={styles.iconButton} title="Arquivar assento" aria-label={`Arquivar assento ${row.fileira}${row.numero}`} onClick={() => setDialog({ type: 'seatArchive', item: row })}><Archive size={15} /></button>}</div></div>)}</div>}<UnitMore list={seats} /></div></section>}
    <Dialog open={canManage&&Boolean(dialog)} onOpenChange={open => { if (!open && !roomAction.pending && !seatAction.pending) setDialog(null); }}><DialogContent className={styles.dialog}><DialogTitle>{dialog?.type?.includes('Archive') ? 'Arquivar registro' : dialog?.type === 'roomForm' ? item ? 'Editar sala' : 'Nova sala' : item ? 'Editar assento' : 'Novo assento'}</DialogTitle><DialogDescription>{dialog?.type?.includes('Archive') ? 'Confirme a alteração. Registros ligados a sessões podem não permitir arquivamento.' : context.locations[0]?.nome}</DialogDescription>
      {dialog?.type === 'roomForm' && <form key={item?.id_sala ?? 'new-room'} className={styles.form} onSubmit={saveRoom}><label>Nome<input name="nome" required maxLength={100} defaultValue={item?.nome ?? ''} /></label><label>Capacidade<input name="capacidade" type="number" required min="1" defaultValue={item?.capacidade ?? ''} /></label><label>Formato<select name="tipo" defaultValue={item?.tipo ?? '2D'}>{roomTypes.map(value => <option key={value}>{value}</option>)}</select></label><label>Estado<select name="status" defaultValue={item?.status ?? 'INATIVA'}><option value="INATIVA">Inativa</option><option value="MANUTENCAO">Manutenção</option>{item && <option value="ATIVA">Ativa</option>}</select></label><div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="submit" className={styles.button} disabled={roomAction.pending}>Salvar</button></div></form>}
      {dialog?.type === 'seatForm' && <form key={item?.id_assento ?? 'new-seat'} className={styles.form} onSubmit={saveSeat}><label>Fileira<input name="fileira" required maxLength={5} defaultValue={item?.fileira ?? ''} /></label><label>Número<input name="numero" type="number" required min="1" defaultValue={item?.numero ?? ''} /></label><label>Tipo<select name="tipo" defaultValue={item?.tipo ?? 'COMUM'}>{seatTypes.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><label>Estado<select name="status" defaultValue={item?.status ?? 'ATIVA'}><option value="ATIVA">Ativa</option><option value="INATIVA">Inativa</option></select></label><div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="submit" className={styles.button} disabled={seatAction.pending}>Salvar</button></div></form>}
      {dialog?.type?.includes('Archive') && <div className={styles.row}><button type="button" className={styles.secondary} onClick={() => setDialog(null)}>Voltar</button><button type="button" className={styles.button} onClick={archive} disabled={roomAction.pending || seatAction.pending}><RotateCcw size={16} />Confirmar</button></div>}
      {(roomAction.error || seatAction.error) && <p className={`${styles.message} ${styles.error}`} role="alert">{roomAction.error || seatAction.error}</p>}
    </DialogContent></Dialog>
  </UnitLayout>;
}
