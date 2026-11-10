'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { useAdminSales } from '@/hooks/admin/use-admin-sales';
import SalesLayout, { SalesState, dateTime, money, statusName } from './sales-layout';
import styles from '../catalog/catalog.module.css';

const orders = { title: 'Pedidos', description: 'Acompanhe as compras registradas pelos clientes.', statuses: ['EM_ANDAMENTO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'CANCELADO', 'FINALIZADO'] };
const payments = { title: 'Pagamentos', description: 'Consulte as tentativas de pagamento e seus resultados.', statuses: ['PENDENTE', 'APROVADO', 'RECUSADO', 'PARCIALMENTE_ESTORNADO', 'ESTORNADO'] };

export default function SalesList({ kind }) {
  const config = kind === 'orders' ? orders : payments;
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const params = new URLSearchParams({ limit: '20' });
  if (status) params.set('status', status);
  if (/^[1-9]\d{0,9}$/.test(userId)) params.set('userId', userId);
  if (kind === 'payments' && /^[1-9]\d{0,19}$/.test(orderId)) params.set('orderId', orderId);
  const hasInvalidId = Boolean(userId && !/^[1-9]\d{0,9}$/.test(userId)) || Boolean(kind === 'payments' && orderId && !/^[1-9]\d{0,19}$/.test(orderId));
  const list = useAdminSales(hasInvalidId ? null : `${kind}?${params}`);
  const orderParams = new URLSearchParams({ limit: '100' });
  if (userId && !hasInvalidId) orderParams.set('userId', userId);
  const availableOrders = useAdminSales(kind === 'payments' && !hasInvalidId ? `orders?${orderParams}` : null);
  const exactOrderId = /^[1-9]\d{0,19}$/.test(orderSearch.trim()) && BigInt(orderSearch.trim()) <= 18446744073709551615n ? orderSearch.trim() : null;
  const visibleOrders = availableOrders.items.filter(order => !orderSearch.trim() || order.id.includes(orderSearch.trim()));

  return <SalesLayout title={config.title} description={config.description}>
    <section className={styles.panel} aria-labelledby="sales-list-title">
      <header className={styles.panelHeader}><div><h2 id="sales-list-title">{config.title} registrados</h2><p>Ordenados pelos registros mais recentes.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}>
        <label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{config.statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label>
        <UserLookupFilter label="Cliente" role="CLIENTE" value={userId} onChange={value => { setUserId(value); setOrderId(''); setOrderSearch(''); }} />
        {kind === 'payments' && <label className={styles.filter}>Buscar pedido<input type="search" inputMode="numeric" value={orderSearch} onChange={event => setOrderSearch(event.target.value)} placeholder="Número do pedido" /></label>}
        {kind === 'payments' && <label className={styles.filter}>Pedido<select value={orderId} onChange={event => setOrderId(event.target.value)}><option value="">Todos</option>{orderId && !visibleOrders.some(order => order.id === orderId) && <option value={orderId}>Pedido #{orderId}</option>}{exactOrderId && exactOrderId !== orderId && !visibleOrders.some(order => order.id === exactOrderId) && <option value={exactOrderId}>Pedido #{exactOrderId}</option>}{visibleOrders.map(order => <option key={order.id} value={order.id}>#{order.id} · {order.customer} · {money(order.total)}</option>)}</select></label>}
        {kind === 'payments' && availableOrders.nextCursor && <button type="button" className={styles.lookupMore} onClick={availableOrders.loadMore} disabled={availableOrders.loadingMore}>{availableOrders.loadingMore ? 'Carregando…' : 'Mais pedidos'}</button>}
        {kind === 'payments' && availableOrders.error && <button type="button" className={styles.lookupMore} onClick={availableOrders.reload} title={availableOrders.error}>Recarregar pedidos</button>}
      </div>
      {hasInvalidId && <p className={styles.error} role="alert">Informe um ID numérico válido ou deixe o filtro vazio.</p>}
      {!hasInvalidId && <SalesState list={list} empty={`Nenhum ${kind === 'orders' ? 'pedido' : 'pagamento'} encontrado.`} noun={config.title.toLocaleLowerCase('pt-BR')} />}
      {!hasInvalidId && list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Tabela de ${config.title.toLocaleLowerCase('pt-BR')}; role horizontalmente em telas pequenas`} tabIndex={0}>
        <table className={styles.table}><caption className="sr-only">{config.title}</caption><thead><tr><th scope="col">Registro</th><th scope="col">Cliente</th>{kind === 'payments' && <th scope="col">Método</th>}<th scope="col">Status</th><th scope="col">{kind === 'orders' ? 'Total' : 'Valor'}</th><th scope="col">Data</th><th scope="col">Ações</th></tr></thead><tbody>
          {list.items.map(row => <tr key={row.id}><th scope="row">#{row.id}</th><td>{row.customer}<small className={styles.muted}> · #{row.userId}</small></td>{kind === 'payments' && <td>{statusName(row.method)}</td>}<td><span className={`${styles.badge} ${['CANCELADO', 'RECUSADO', 'ESTORNADO'].includes(row.status) ? styles.inactive : ''}`}>{statusName(row.status)}</span></td><td>{money(kind === 'orders' ? row.total : row.amount)}</td><td>{dateTime(row.createdAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver ${kind === 'orders' ? 'pedido' : 'pagamento'} ${row.id}`} onClick={() => setSelected(row)}><Eye size={16} aria-hidden="true" /></button></div></td></tr>)}
        </tbody></table>
      </div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{kind === 'orders' ? 'Pedido' : 'Pagamento'} #{selected?.id}</DialogTitle><DialogDescription className={styles.dialogDescription}>Registro administrativo de Vendas.</DialogDescription>
      {selected && <dl className={styles.detailGrid}><div><dt>Cliente</dt><dd>{selected.customer} · #{selected.userId}</dd></div><div><dt>Status</dt><dd>{statusName(selected.status)}</dd></div><div><dt>{kind === 'orders' ? 'Total' : 'Valor'}</dt><dd>{money(kind === 'orders' ? selected.total : selected.amount)}</dd></div><div><dt>Registrado em</dt><dd>{dateTime(selected.createdAt)}</dd></div>{kind === 'payments' && <><div><dt>Método</dt><dd>{statusName(selected.method)}</dd></div><div><dt>Pedido</dt><dd>{selected.orderId ? `#${selected.orderId}` : '—'}</dd></div><div><dt>Cobrança</dt><dd>{selected.chargeId ? `#${selected.chargeId}` : '—'}</dd></div><div><dt>Pago em</dt><dd>{dateTime(selected.paidAt)}</dd></div></>}</dl>}
    </DialogContent></Dialog>
  </SalesLayout>;
}
