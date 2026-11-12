'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Check, Eye, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminSchedule } from '@/hooks/admin/use-admin-schedule';
import { useAdminSnacks } from '@/hooks/admin/use-admin-snacks';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState, dateTime, statusName } from './supply-layout';
import styles from '../catalog/catalog.module.css';

export default function RequestsAdmin() {
  const [localId, setLocalId] = useState('');
  const [kind, setKind] = useState('input');
  const [formLocalId, setFormLocalId] = useState('');
  const [formItemId, setFormItemId] = useState('');
  const [formSessionId, setFormSessionId] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [itemQuery, setItemQuery] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const list = useAdminSupply(`requests?limit=20${localId ? `&localId=${localId}` : ''}`);
  const locals = useAdminVenues('locations?limit=100');
  const actions = useSupplyActions(list);
  const formOpen = actions.dialog?.type === 'form';
  const inputs = useAdminSnacks(formOpen && kind === 'input' ? 'inputs?limit=100&status=DISPONIVEL' : null);
  const equipment = useAdminSupply(formOpen && kind === 'equipment' ? 'equipment?limit=100&status=DISPONIVEL' : null);
  const sessions = useAdminSchedule(formOpen && formLocalId ? `sessions?limit=100&localId=${formLocalId}${sessionDate ? `&date=${sessionDate}` : ''}` : null);
  const source = kind === 'input' ? inputs : equipment;
  const localName = id => locals.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}`;
  const sourceId = row => kind === 'input' ? row.id_insumo : row.id_equipamento;
  const visibleItems = source.items.filter(row => row.quantidade > 0 && `${row.nome} ${localName(row.id_local)} #${sourceId(row)}`.toLocaleLowerCase('pt-BR').includes(itemQuery.trim().toLocaleLowerCase('pt-BR')));
  const selectedItem = source.items.find(row => sourceId(row) === formItemId);
  const availableSessions = sessions.items.filter(row => ['AGENDADA', 'EM_CARTAZ'].includes(row.status));
  const item = actions.dialog?.item;
  const itemName = row => row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`;

  function openForm() { setKind('input'); setFormLocalId(''); setFormItemId(''); setFormSessionId(''); setFormQuantity(''); setItemQuery(''); setSessionDate(''); actions.open('form'); }
  function changeLocal(value) { setFormLocalId(value); setFormItemId(''); setFormSessionId(''); setFormQuantity(''); setSessionDate(''); }
  function changeKind(value) { setKind(value); setFormItemId(''); setFormSessionId(''); setFormQuantity(''); setItemQuery(''); }
  function changeItem(value) { setFormItemId(value); setFormQuantity(kind === 'equipment' ? String(source.items.find(row => sourceId(row) === value)?.quantidade ?? '') : ''); }
  const sessionLabel = row => `${row.titulo_filme ?? 'Sessão'} · ${row.data} às ${row.horario_inicio?.slice(0, 5) ?? ''} · ${row.nome_sala ?? `Sala #${row.id_sala}`}`;

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const destination = String(form.get('localId') ?? '');
    const id = String(form.get('itemId') ?? '').trim();
    const sessionId = String(form.get('sessionId') ?? '').trim();
    const quantity = Number(form.get('quantity'));
    const note = String(form.get('note') ?? '').trim();
    const validId = value => /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
    if (!validId(destination) || !validId(id) || sessionId && !validId(sessionId) || kind === 'equipment' && !sessionId || !Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647 || note.length > 2000) { actions.setError('Confira cinema, item, sessão e quantidade. Equipamentos exigem uma sessão.'); return; }
    const body = { localId: destination, ...(sessionId ? { sessionId } : {}), [kind === 'input' ? 'inputId' : 'equipmentId']: id, quantity, ...(note ? { note } : {}) };
    actions.run(() => supplyRequest('requests', { method: 'POST', body }), 'Solicitação registrada.');
  }
  const decision = actions.dialog?.type === 'approve' ? 'approve' : 'refuse';

  return <SupplyLayout title="Solicitações" description="Acompanhe pedidos de insumos e equipamentos para os cinemas." action={<button type="button" className={styles.primary} onClick={openForm}><Plus size={16} aria-hidden="true" />Nova solicitação</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="requests-title"><header className={styles.panelHeader}><div><h2 id="requests-title">Pedidos de estoque</h2><p>A aprovação cria um envio para a logística.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Cinema<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div>
      <SupplyState list={list} empty="Nenhuma solicitação encontrada." noun="solicitações" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de solicitações; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Solicitações de estoque</caption><thead><tr><th scope="col">Solicitação</th><th scope="col">Cinema</th><th scope="col">Item</th><th scope="col">Quantidade</th><th scope="col">Status</th><th scope="col">Data</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_solicitacao}><th scope="row">#{row.id_solicitacao}</th><td>{localName(row.id_local)}</td><td>{itemName(row)}</td><td>{row.quantidade}</td><td><span className={`${styles.badge} ${['RECUSADA', 'CANCELADA'].includes(row.status) ? styles.inactive : ''}`}>{row.status_supervisao === 'PENDENTE' ? 'Pendente de supervisão' : statusName(row.status)}</span></td><td>{dateTime(row.data_solicitacao)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver solicitação ${row.id_solicitacao}`} onClick={() => actions.open('view', row)}><Eye size={16} aria-hidden="true" /></button>{row.status === 'PENDENTE' && row.status_supervisao !== 'PENDENTE' && <><button type="button" className={styles.iconButton} title="Aprovar solicitação" aria-label={`Aprovar solicitação ${row.id_solicitacao}`} onClick={() => actions.open('approve', row)}><Check size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Recusar solicitação" aria-label={`Recusar solicitação ${row.id_solicitacao}`} onClick={() => actions.open('refuse', row)}><X size={16} aria-hidden="true" /></button></>}</div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'form' ? 'Nova solicitação' : actions.dialog?.type === 'view' ? `Solicitação #${item?.id_solicitacao}` : `${decision === 'approve' ? 'Aprovar' : 'Recusar'} solicitação #${item?.id_solicitacao}`}</DialogTitle><DialogDescription className={styles.dialogDescription}>{actions.dialog?.type === 'form' ? 'O item e o fornecedor precisam estar disponíveis e autorizados no cinema de destino.' : actions.dialog?.type === 'approve' ? 'A aprovação reserva o encaminhamento para a logística.' : actions.dialog?.type === 'refuse' ? 'A solicitação será recusada.' : 'Detalhes do pedido de estoque.'}</DialogDescription>
      {formOpen && <form className={styles.form} onSubmit={save}>
        <label>Cinema de destino<select name="localId" value={formLocalId} onChange={event => changeLocal(event.target.value)} required><option value="">Selecione</option>{locals.items.filter(row => row.status === 'ATIVO').map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label>
        <label>Tipo de item<select value={kind} onChange={event => changeKind(event.target.value)}><option value="input">Insumo</option><option value="equipment">Equipamento</option></select></label>
        {locals.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{locals.error}</p>}
        {locals.nextCursor && <button type="button" className={`${styles.secondary} ${styles.wide}`} onClick={locals.loadMore} disabled={locals.loadingMore}>{locals.loadingMore ? 'Carregando…' : 'Mais cinemas'}</button>}
        <div className={`${styles.wide} ${styles.requestPicker}`}>
          <label>Buscar item disponível<input type="search" value={itemQuery} onChange={event => setItemQuery(event.target.value)} placeholder="Nome ou cinema de origem" /></label>
          <label>{kind === 'input' ? 'Insumo' : 'Equipamento'}<select name="itemId" value={formItemId} onChange={event => changeItem(event.target.value)} required disabled={source.loading}>
            <option value="">Selecione um item com estoque</option>
            {formItemId && !visibleItems.some(row => sourceId(row) === formItemId) && selectedItem && <option value={formItemId}>{selectedItem.nome} · {localName(selectedItem.id_local)} · #{formItemId}</option>}
            {visibleItems.map(row => <option key={sourceId(row)} value={sourceId(row)}>{row.nome} · {localName(row.id_local)} · {row.quantidade} em estoque · #{sourceId(row)}</option>)}
          </select></label>
          {source.loading && <p className={styles.hint} role="status">Carregando itens…</p>}
          {source.error && <div role="alert"><p className={styles.error}>{source.error}</p><button type="button" className={styles.secondary} onClick={source.reload}>Tentar novamente</button></div>}
          {!source.loading && !source.error && !visibleItems.length && <p className={styles.hint}>Nenhum item com estoque entre os registros carregados.</p>}
          {source.nextCursor && <button type="button" className={styles.secondary} onClick={source.loadMore} disabled={source.loadingMore}>{source.loadingMore ? 'Carregando…' : 'Mais itens'}</button>}
        </div>
        <label>Quantidade<input name="quantity" type="number" min="1" max="2147483647" value={formQuantity} onChange={event => setFormQuantity(event.target.value)} readOnly={kind === 'equipment'} required /></label>
        <label>Data da sessão<input type="date" value={sessionDate} onChange={event => { setSessionDate(event.target.value); setFormSessionId(''); }} disabled={!formLocalId} /></label>
        <div className={`${styles.wide} ${styles.requestPicker}`}>
          <label>Sessão {kind === 'equipment' ? '(obrigatória)' : '(opcional)'}<select name="sessionId" value={formSessionId} onChange={event => setFormSessionId(event.target.value)} required={kind === 'equipment'} disabled={!formLocalId || sessions.loading}>
            <option value="">{kind === 'equipment' ? 'Selecione uma sessão' : 'Sem sessão'}</option>
            {availableSessions.map(row => <option key={row.id_sessao} value={row.id_sessao}>{sessionLabel(row)} · #{row.id_sessao}</option>)}
          </select></label>
          {sessions.loading && <p className={styles.hint} role="status">Carregando sessões…</p>}
          {sessions.error && <div role="alert"><p className={styles.error}>{sessions.error}</p><button type="button" className={styles.secondary} onClick={sessions.reload}>Tentar novamente</button></div>}
          {formLocalId && !sessions.loading && !sessions.error && !availableSessions.length && <p className={styles.hint}>Nenhuma sessão agendada ou em cartaz entre os registros carregados.</p>}
          {sessions.nextCursor && <button type="button" className={styles.secondary} onClick={sessions.loadMore} disabled={sessions.loadingMore}>{sessions.loadingMore ? 'Carregando…' : 'Mais sessões'}</button>}
        </div>
        {kind === 'equipment' && <p className={`${styles.hint} ${styles.wide}`}>Equipamentos são transferidos na quantidade total disponível no cinema de origem.</p>}
        <label className={styles.wide}>Observação<textarea name="note" maxLength={2000} /></label>
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending || source.loading || sessions.loading}>{actions.pending ? 'Registrando…' : 'Criar solicitação'}</button></div>
      </form>}
      {actions.dialog?.type === 'view' && item && <dl className={styles.detailGrid}><div><dt>Cinema</dt><dd>{localName(item.id_local)}</dd></div><div><dt>Item</dt><dd>{itemName(item)}</dd></div><div><dt>Quantidade</dt><dd>{item.quantidade}</dd></div><div><dt>Status</dt><dd>{statusName(item.status)}</dd></div><div><dt>Sessão</dt><dd>{item.id_sessao ? `#${item.id_sessao}` : '—'}</dd></div><div><dt>Solicitante</dt><dd>#{item.id_usuario}</dd></div><div><dt>Data</dt><dd>{dateTime(item.data_solicitacao)}</dd></div><div><dt>Observação</dt><dd>{item.observacao || '—'}</dd></div></dl>}
      {['approve', 'refuse'].includes(actions.dialog?.type) && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={decision === 'approve' ? styles.primary : styles.danger} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`requests/${item.id_solicitacao}/${decision}`, { method: 'POST' }), decision === 'approve' ? 'Solicitação aprovada.' : 'Solicitação recusada.')}>{actions.pending ? 'Aguarde…' : decision === 'approve' ? 'Aprovar' : 'Recusar'}</button></div>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </SupplyLayout>;
}
