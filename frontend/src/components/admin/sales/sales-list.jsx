'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Ban, Eye, FileText, Pencil, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminSales } from '@/hooks/admin/use-admin-sales';
import SalesLayout, { SalesState, dateTime, money, statusName } from './sales-layout';
import SalesActionsDialog from './sales-actions-dialog';
import styles from '../catalog/catalog.module.css';

const orders = { title: 'Pedidos', description: 'Acompanhe as compras registradas pelos clientes.', statuses: ['EM_ANDAMENTO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'CANCELADO', 'FINALIZADO'] };
const payments = { title: 'Pagamentos', description: 'Consulte as tentativas de pagamento e seus resultados.', statuses: ['PENDENTE', 'APROVADO', 'RECUSADO', 'PARCIALMENTE_ESTORNADO', 'ESTORNADO'] };

export default function SalesList({ kind }) {
  const config = kind === 'orders' ? orders : payments;
  const [filters, setFilters] = useState({});
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState(null);
  const [notice, setNotice] = useState('');
  const list = useAdminSales(`${kind}?${new URLSearchParams({ limit: '20', ...filters })}`);

  function applyFilters(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const orderInput = String(form.get('orderId') ?? '').trim();
    const orderId = orderInput.replace(/^#\s*/, '');
    if (orderInput && (!/^[1-9]\d{0,19}$/.test(orderId) || BigInt(orderId) > 18446744073709551615n)) {
      setFilterError('Informe o número completo do pedido.');
      return;
    }
    const customerName = String(form.get('customerName') ?? '').trim();
    const status = String(form.get('status') ?? '');
    setFilterError('');
    setFilters({ ...(status && { status }), ...(customerName && { customerName }), ...(orderId && { orderId }) });
  }

  return <SalesLayout title={config.title} description={config.description} action={kind === 'orders' && <button type="button" className={styles.primary} onClick={() => setOperation({ mode: 'create' })}><Plus size={16} aria-hidden="true" />Novo pedido</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="sales-list-title">
      <header className={styles.panelHeader}><div><h2 id="sales-list-title">{config.title} registrados</h2><p>Ordenados pelos registros mais recentes.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <form className={`${styles.toolbar} ${styles.salesFilters}`} onSubmit={applyFilters} onReset={() => { setFilters({}); setFilterError(''); }}>
        <label className={styles.filter}>Status<select name="status"><option value="">Todos</option>{config.statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label>
        <label className={styles.filter}>Buscar cliente por nome<input type="search" name="customerName" maxLength={100} placeholder="Nome completo ou parcial" /></label>
        {kind === 'payments' && <label className={styles.filter}>Buscar pedido<input name="orderId" type="search" inputMode="numeric" maxLength={22} placeholder="Número do pedido" aria-invalid={Boolean(filterError)} aria-describedby={filterError ? 'sales-filter-error' : undefined} onChange={() => setFilterError('')} /></label>}
        <button type="submit" className={styles.primary}>Aplicar filtros</button>
        <button type="reset" className={styles.secondary}>Limpar</button>
        {filterError && <p className={styles.error} id="sales-filter-error" role="alert">{filterError}</p>}
      </form>
      <SalesState list={list} empty={`Nenhum ${kind === 'orders' ? 'pedido' : 'pagamento'} encontrado.`} noun={config.title.toLocaleLowerCase('pt-BR')} />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Tabela de ${config.title.toLocaleLowerCase('pt-BR')}; role horizontalmente em telas pequenas`} tabIndex={0}>
        <table className={styles.table}><caption className="sr-only">{config.title}</caption><thead><tr><th scope="col">Registro</th><th scope="col">Cliente</th>{kind === 'payments' && <th scope="col">Método</th>}<th scope="col">Status</th><th scope="col">{kind === 'orders' ? 'Total' : 'Valor'}</th><th scope="col">Data</th><th scope="col">Ações</th></tr></thead><tbody>
          {list.items.map(row => <tr key={row.id}><th scope="row">#{row.id}{kind === 'payments' && row.orderId && <small className={`block ${styles.muted}`}>Pedido #{row.orderId}</small>}</th><td>{row.customer}<small className={styles.muted}> · #{row.userId}</small></td>{kind === 'payments' && <td>{statusName(row.method)}</td>}<td><span className={`${styles.badge} ${['CANCELADO', 'RECUSADO', 'ESTORNADO'].includes(row.status) ? styles.inactive : ''}`}>{row.draft && row.status === 'EM_ANDAMENTO' ? 'Proposta' : statusName(row.status)}</span></td><td>{row.draft && row.status === 'EM_ANDAMENTO' ? '—' : money(kind === 'orders' ? row.total : row.amount)}</td><td>{dateTime(row.createdAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver ${kind === 'orders' ? 'pedido' : 'pagamento'} ${row.id}`} onClick={() => setSelected(row)}><Eye size={16} aria-hidden="true" /></button>
            {kind === 'orders' && row.draft && row.status === 'EM_ANDAMENTO' && <button type="button" className={styles.iconButton} title="Editar proposta" aria-label={`Editar pedido ${row.id}`} onClick={() => setOperation({ mode: 'edit', row })}><Pencil size={16} aria-hidden="true" /></button>}
            {kind === 'orders' && (row.status === 'AGUARDANDO_PAGAMENTO' || row.draft && row.status === 'EM_ANDAMENTO') && <button type="button" className={styles.iconButton} title="Cancelar pedido" aria-label={`Cancelar pedido ${row.id}`} onClick={() => setOperation({ mode: 'cancel', row })}><Ban size={16} aria-hidden="true" /></button>}
            {kind === 'payments' && row.reconcilable && <button type="button" className={styles.iconButton} title="Consultar provedor" aria-label={`Conciliar pagamento ${row.id}`} onClick={() => setOperation({ mode: 'reconcile', row })}><RefreshCw size={16} aria-hidden="true" /></button>}
            {kind === 'orders' && ['PAGO','FINALIZADO'].includes(row.status) && <button type="button" className={styles.iconButton} title="Solicitar reembolso" aria-label={`Solicitar reembolso do pedido ${row.id}`} onClick={()=>setOperation({mode:'refund',row})}><RotateCcw size={16} aria-hidden="true" /></button>}
            {kind === 'payments' && <button type="button" className={styles.iconButton} title="Notas administrativas" aria-label={`Notas do pagamento ${row.id}`} onClick={() => setOperation({ mode: 'notes', row })}><FileText size={16} aria-hidden="true" /></button>}
          </div></td></tr>)}
        </tbody></table>
      </div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{kind === 'orders' ? 'Pedido' : 'Pagamento'} #{selected?.id}</DialogTitle><DialogDescription className={styles.dialogDescription}>Registro administrativo de Vendas.</DialogDescription>
      {selected && <dl className={styles.detailGrid}><div><dt>Cliente</dt><dd>{selected.customer} · #{selected.userId}</dd></div><div><dt>Status</dt><dd>{statusName(selected.status)}</dd></div><div><dt>{kind === 'orders' ? 'Total' : 'Valor'}</dt><dd>{money(kind === 'orders' ? selected.total : selected.amount)}</dd></div><div><dt>Registrado em</dt><dd>{dateTime(selected.createdAt)}</dd></div>{kind === 'payments' && <><div><dt>Método</dt><dd>{statusName(selected.method)}</dd></div><div><dt>Pedido</dt><dd>{selected.orderId ? `#${selected.orderId}` : '—'}</dd></div><div><dt>Cobrança</dt><dd>{selected.chargeId ? `#${selected.chargeId}` : '—'}</dd></div><div><dt>Pago em</dt><dd>{dateTime(selected.paidAt)}</dd></div></>}</dl>}
      {selected?.cancellation&&<p>Cancelado pelo admin #{selected.cancellation.adminId}. {selected.cancellation.reason}</p>}
    </DialogContent></Dialog>
    {operation && <SalesActionsDialog {...operation} onClose={() => setOperation(null)} onSaved={message => { setOperation(null); setNotice(message); list.reload(); }} />}
  </SalesLayout>;
}
