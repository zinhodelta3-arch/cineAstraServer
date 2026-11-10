'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Eye, PackageCheck, RotateCcw, Send, Truck, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { supplyRequest, useAdminSupply, useSupplyActions } from '@/hooks/admin/use-admin-supply';
import SupplyLayout, { SupplyState, dateTime, statusName } from './supply-layout';
import ReplenishmentLinksAdmin from './replenishment-links-admin';
import styles from '../catalog/catalog.module.css';

const actionNames = { send: 'Enviar', transit: 'Marcar em trânsito', receive: 'Confirmar recebimento', return: 'Registrar devolução', cancel: 'Cancelar envio' };
const actionDescriptions = { send: 'O saldo será retirado da origem.', transit: 'O envio ficará marcado como em trânsito.', receive: 'O item será recebido no cinema de destino.', return: 'Equipamentos só podem voltar após o encerramento da sessão.', cancel: 'Somente envios ainda pendentes podem ser cancelados.' };

export default function LogisticsAdmin() {
  const [localId, setLocalId] = useState('');
  const list = useAdminSupply(`logistics?limit=20${localId ? `&localId=${localId}` : ''}`);
  const locals = useAdminVenues('locations?limit=100');
  const suppliers = useAdminSupply('suppliers?limit=100');
  const actions = useSupplyActions(list);
  const item = actions.dialog?.item;
  const step = actions.dialog?.type;
  const localName = id => id ? locals.items.find(row => row.id_local === id)?.nome ?? `Cinema #${id}` : '—';
  const supplierName = id => suppliers.items.find(row => row.id_fornecedor === id)?.nome_cine || suppliers.items.find(row => row.id_fornecedor === id)?.razao_social || `Fornecedor #${id}`;
  const originItem = row => row.id_insumo_origem ? `Insumo #${row.id_insumo_origem}` : row.id_equipamento_origem ? `Equipamento #${row.id_equipamento_origem}` : '—';

  return <SupplyLayout title="Logística" description="Acompanhe envios de insumos e equipamentos entre cinemas.">
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="logistics-title"><header className={styles.panelHeader}><div><h2 id="logistics-title">Envios</h2><p>O fluxo começa após a aprovação de uma solicitação.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Cinema de destino<select value={localId} onChange={event => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome}</option>)}</select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div>
      <SupplyState list={list} empty="Nenhum envio encontrado." noun="envios" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de logística; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Envios de suprimentos</caption><thead><tr><th scope="col">Envio</th><th scope="col">Item</th><th scope="col">Origem</th><th scope="col">Destino</th><th scope="col">Quantidade</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_logistica}><th scope="row">#{row.id_logistica}</th><td>{originItem(row)}</td><td>{localName(row.id_local_origem)}</td><td>{localName(row.id_local_destino)}</td><td>{row.quantidade}</td><td><span className={`${styles.badge} ${['CANCELADO', 'DEVOLVIDO'].includes(row.status) ? styles.inactive : ''}`}>{statusName(row.status)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver envio ${row.id_logistica}`} onClick={() => actions.open('view', row)}><Eye size={16} aria-hidden="true" /></button>{row.status === 'PENDENTE' && <><button type="button" className={styles.iconButton} title="Enviar" aria-label={`Enviar ${row.id_logistica}`} onClick={() => actions.open('send', row)}><Send size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Cancelar envio" aria-label={`Cancelar envio ${row.id_logistica}`} onClick={() => actions.open('cancel', row)}><XCircle size={16} aria-hidden="true" /></button></>}{row.status === 'ENVIADO' && <><button type="button" className={styles.iconButton} title="Marcar em trânsito" aria-label={`Marcar envio ${row.id_logistica} em trânsito`} onClick={() => actions.open('transit', row)}><Truck size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Confirmar recebimento" aria-label={`Receber envio ${row.id_logistica}`} onClick={() => actions.open('receive', row)}><PackageCheck size={16} aria-hidden="true" /></button></>}{row.status === 'EM_TRANSITO' && <button type="button" className={styles.iconButton} title="Confirmar recebimento" aria-label={`Receber envio ${row.id_logistica}`} onClick={() => actions.open('receive', row)}><PackageCheck size={16} aria-hidden="true" /></button>}{row.status === 'RECEBIDO' && row.id_equipamento_origem && <button type="button" className={styles.iconButton} title="Registrar devolução" aria-label={`Devolver equipamento do envio ${row.id_logistica}`} onClick={() => actions.open('return', row)}><RotateCcw size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <ReplenishmentLinksAdmin locals={locals} />
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{step === 'view' ? `Envio #${item?.id_logistica}` : `${actionNames[step] ?? 'Envio'} #${item?.id_logistica}`}</DialogTitle><DialogDescription className={styles.dialogDescription}>{step === 'view' ? 'Detalhes do envio e das etapas concluídas.' : actionDescriptions[step]}</DialogDescription>
      {step === 'view' && item && <dl className={styles.detailGrid}><div><dt>Solicitação</dt><dd>{item.id_solicitacao ? `#${item.id_solicitacao}` : '—'}</dd></div><div><dt>Fornecedor</dt><dd>{supplierName(item.id_fornecedor)}</dd></div><div><dt>Item</dt><dd>{originItem(item)}</dd></div><div><dt>Quantidade</dt><dd>{item.quantidade}</dd></div><div><dt>Origem</dt><dd>{localName(item.id_local_origem)}</dd></div><div><dt>Destino</dt><dd>{localName(item.id_local_destino)}</dd></div><div><dt>Status</dt><dd>{statusName(item.status)}</dd></div><div><dt>Enviado em</dt><dd>{dateTime(item.data_envio)}</dd></div><div><dt>Previsto para</dt><dd>{dateTime(item.data_prevista)}</dd></div><div><dt>Recebido em</dt><dd>{dateTime(item.data_recebimento)}</dd></div>{item.status === 'RECEBIDO' && item.id_insumo_origem && <div><dt>Insumo creditado</dt><dd>#{item.id_insumo_destino ?? item.id_insumo_origem}</dd></div>}{item.id_usuario_recebimento && <div><dt>Responsável pelo recebimento</dt><dd>Usuário #{item.id_usuario_recebimento}</dd></div>}<div><dt>Devolvido em</dt><dd>{dateTime(item.data_devolucao)}</dd></div><div><dt>Observação</dt><dd>{item.observacao || '—'}</dd></div></dl>}
      {actionNames[step] && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={step === 'cancel' ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => supplyRequest(`logistics/${item.id_logistica}/${step}`, { method: 'POST' }), `${actionNames[step]} registrado.`)}>{actions.pending ? 'Aguarde…' : actionNames[step]}</button></div>}
      {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </SupplyLayout>;
}
