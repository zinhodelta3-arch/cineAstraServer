'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Eye, PackageCheck, Pencil, Plus, RotateCcw, Send, Truck, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import ShipmentEstimate from '@/components/logistics/shipment-estimate';
import ShipmentDispatchForm from '@/components/logistics/shipment-dispatch-form';
import ShipmentHistory from '@/components/logistics/shipment-history';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState, dateTime, statusName } from './supply-layout';
import ReplenishmentLinksAdmin from './replenishment-links-admin';
import styles from '../catalog/catalog.module.css';

const actionNames = { send: 'Enviar', transit: 'Marcar em trânsito', receive: 'Confirmar recebimento', return: 'Registrar devolução', cancel: 'Cancelar envio' };
const actionDescriptions = { send: 'O saldo será retirado da origem.', transit: 'O envio ficará marcado como em trânsito.', receive: 'O item será recebido no cinema de destino.', return: 'Equipamentos só podem voltar após o encerramento da sessão.', cancel: 'Somente envios ainda pendentes podem ser cancelados.' };

export default function LogisticsAdmin() {
  const [localId, setLocalId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const list = useAdminSupply(`logistics?limit=20${localId ? `&localId=${localId}` : ''}${supplierId ? `&supplierId=${supplierId}` : ''}`);
  const locals = useAdminVenues('locations?limit=100');
  const suppliers = useAdminSupply('suppliers?limit=100');
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;
  const step = actions.dialog?.type;
  const approved = useAdminSupply(step === 'create' ? 'requests?status=APROVADA&withoutShipment=true&limit=20' : null);
  const localName = id => id ? locals.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}` : '—';
  const supplierName = id => suppliers.items.find(row => row.id_fornecedor === id)?.nome_cine || suppliers.items.find(row => row.id_fornecedor === id)?.razao_social || `Fornecedor #${id}`;
  const originItem = row => row.id_insumo_origem ? `Insumo #${row.id_insumo_origem}` : row.id_equipamento_origem ? `Equipamento #${row.id_equipamento_origem}` : '—';

  function prepare(event) {
    event.preventDefault();
    const requestId = new FormData(event.currentTarget).get('requestId');
    actions.run(() => supplyRequest('logistics', { method: 'POST', body: { requestId } }), 'Entrega preparada.');
  }

  return <SupplyLayout title="Logística" description="Acompanhe envios, transportes e recebimentos dos fornecedores."
    action={<button type="button" className={styles.primary} onClick={() => actions.open('create')}><Plus size={16} aria-hidden="true" />Preparar entrega</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="logistics-title"><header className={styles.panelHeader}><div><h2 id="logistics-title">Envios</h2><p>O fluxo começa após a aprovação de uma solicitação.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Cinema de destino<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}
        <label className={styles.filter}>Fornecedor<select value={supplierId} onChange={event => setSupplierId(event.target.value)}><option value="">Todos</option>
          {suppliers.items.map(row => <option key={row.id_fornecedor} value={row.id_fornecedor}>{row.nome_cine || row.razao_social} · #{row.id_fornecedor}</option>)}
        </select></label>{suppliers.nextCursor && <button type="button" className={styles.secondary} onClick={suppliers.loadMore} disabled={suppliers.loadingMore}>Mais fornecedores</button>}
      </div>
      <SupplyState list={list} empty="Nenhum envio encontrado." noun="envios" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de logística; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Envios de suprimentos</caption><thead><tr><th scope="col">Envio</th><th scope="col">Fornecedor</th><th scope="col">Item</th><th scope="col">Origem</th><th scope="col">Destino</th><th scope="col">Quantidade</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_logistica}><th scope="row">Entrega</th><td>{supplierName(row.id_fornecedor)}</td><td>{originItem(row)}</td><td>{localName(row.id_local_origem)}</td><td>{localName(row.id_local_destino)}</td><td>{row.quantidade}</td><td><span className={`${styles.badge} ${['CANCELADO', 'DEVOLVIDO'].includes(row.status) ? styles.inactive : ''}`}>{statusName(row.status)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver envio ${row.id_logistica}`} onClick={() => actions.open('view', row)}><Eye size={16} aria-hidden="true" /></button>{row.status === 'PENDENTE' && <><button type="button" className={styles.iconButton} title="Editar entrega" aria-label={`Editar entrega ${row.id_logistica}`} onClick={() => actions.open('edit', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Enviar" aria-label={`Enviar ${row.id_logistica}`} onClick={() => actions.open('send', row)}><Send size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Cancelar envio" aria-label={`Cancelar envio ${row.id_logistica}`} onClick={() => actions.open('cancel', row)}><XCircle size={16} aria-hidden="true" /></button></>}{row.status === 'ENVIADO' && <><button type="button" className={styles.iconButton} title="Marcar em trânsito" aria-label={`Marcar envio ${row.id_logistica} em trânsito`} onClick={() => actions.open('transit', row)}><Truck size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Confirmar recebimento" aria-label={`Receber envio ${row.id_logistica}`} onClick={() => actions.open('receive', row)}><PackageCheck size={16} aria-hidden="true" /></button></>}{row.status === 'EM_TRANSITO' && <button type="button" className={styles.iconButton} title="Confirmar recebimento" aria-label={`Receber envio ${row.id_logistica}`} onClick={() => actions.open('receive', row)}><PackageCheck size={16} aria-hidden="true" /></button>}{row.status === 'RECEBIDO' && row.id_equipamento_origem && <button type="button" className={styles.iconButton} title="Registrar devolução" aria-label={`Devolver equipamento do envio ${row.id_logistica}`} onClick={() => actions.open('return', row)}><RotateCcw size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <div className="mt-6"><ReplenishmentLinksAdmin locals={locals} /></div>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{step === 'create' ? 'Preparar entrega' : step === 'view' ? `Envio #${item?.id_logistica}` : `${step === 'edit' ? 'Editar entrega' : actionNames[step] ?? 'Envio'} #${item?.id_logistica}`}</DialogTitle><DialogDescription className={styles.dialogDescription}>{step === 'create' ? 'Selecione uma solicitação aprovada que ainda esteja sem entrega.' : step === 'edit' ? 'Revise a observação e o transporte antes do envio.' : step === 'view' ? 'Detalhes do envio e das etapas concluídas.' : actionDescriptions[step]}</DialogDescription>
      {step === 'view' && item && <dl className={styles.detailGrid}><div><dt>Solicitação</dt><dd>{item.id_solicitacao ? `#${item.id_solicitacao}` : '—'}</dd></div><div><dt>Fornecedor</dt><dd>{supplierName(item.id_fornecedor)}</dd></div><div><dt>Item</dt><dd>{originItem(item)}</dd></div><div><dt>Quantidade</dt><dd>{item.quantidade}</dd></div><div><dt>Origem</dt><dd>{localName(item.id_local_origem)}</dd></div><div><dt>Destino</dt><dd>{localName(item.id_local_destino)}</dd></div><div><dt>Status</dt><dd>{statusName(item.status)}</dd></div><div><dt>Enviado em</dt><dd>{dateTime(item.data_envio)}</dd></div><div><dt>Transporte</dt><dd>{item.nome_transporte ?? 'Sem transporte vinculado'}</dd></div><ShipmentEstimate shipment={item} /><div><dt>Recebido em</dt><dd>{dateTime(item.data_recebimento)}</dd></div>{item.status === 'RECEBIDO' && item.id_insumo_origem && <div><dt>Insumo creditado</dt><dd>#{item.id_insumo_destino ?? item.id_insumo_origem}</dd></div>}{item.id_usuario_recebimento && <div><dt>Responsável pelo recebimento</dt><dd>Usuário #{item.id_usuario_recebimento}</dd></div>}<div><dt>Devolvido em</dt><dd>{dateTime(item.data_devolucao)}</dd></div><div><dt>Observação</dt><dd>{item.observacao || '—'}</dd></div></dl>}
      {step === 'view' && item && <ShipmentHistory path={`logistics/${item.id_logistica}/history?limit=10`} request={supplyRequest} />}
      {step === 'create' && <form className={styles.form} onSubmit={prepare}>
        <label className={styles.wide}>Solicitação aprovada<select name="requestId" defaultValue="" required disabled={approved.loading || !approved.items.length}>
          <option value="">Selecione</option>
          {approved.items.map(row => <option key={row.id_solicitacao} value={row.id_solicitacao}>#{row.id_solicitacao} · {row.nome_item || (row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`)} · {localName(row.id_local)} · {row.quantidade} un.</option>)}
        </select></label>
        <div className={styles.wide}><SupplyState list={approved} empty="Nenhuma solicitação aprovada aguarda entrega." noun="solicitações" /></div>
        {approved.nextCursor && <button type="button" className={styles.secondary} onClick={approved.loadMore} disabled={approved.loadingMore}>Mais solicitações</button>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="submit" className={styles.primary} disabled={actions.pending || !approved.items.length}>Preparar entrega</button></div>
      </form>}
      {['send', 'edit'].includes(step) && <ShipmentDispatchForm key={`${step}:${item.id_logistica}`} shipment={item} request={supplyRequest} edit={step === 'edit'} pending={actions.pending} onClose={actions.close}
        onSubmit={body => actions.run(() => supplyRequest(`logistics/${item.id_logistica}${step === 'send' ? '/send' : ''}`, { method: step === 'send' ? 'POST' : 'PATCH', body }), step === 'send' ? 'Envio confirmado.' : 'Entrega atualizada.')} />}
      {actionNames[step] && step !== 'send' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={step === 'cancel' ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`logistics/${item.id_logistica}${step === 'cancel' ? '' : `/${step}`}`, { method: step === 'cancel' ? 'DELETE' : 'POST' }), step === 'cancel' ? 'Entrega cancelada.' : `${actionNames[step]} registrado.`)}>{actions.pending ? 'Aguarde…' : actionNames[step]}</button></div>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </SupplyLayout>;
}
