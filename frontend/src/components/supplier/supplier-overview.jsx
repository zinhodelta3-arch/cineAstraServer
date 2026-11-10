'use client';

import Link from 'next/link';
import { useSupplierList, useSupplierLocations } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { dateTime, SupplierState } from './supplier-layout';
import page from '@/components/admin/tabelaexemplo/example-table.module.css';
import styles from '@/components/admin/catalog/catalog.module.css';
import { useLocalPagination } from '@/hooks/use-paginated-list';
import TablePagination from '@/components/ui/table-pagination';

export default function SupplierOverview() {
  const requests = useSupplierList('requests?limit=100');
  const deliveries = useSupplierList('logistics?limit=100');
  const locations = useSupplierLocations();
  const pending = requests.items.filter(row => row.status === 'PENDENTE');
  const pendingPage = useLocalPagination(pending, { initialPageSize: 5, loading: requests.loading });
  const preparing = deliveries.items.filter(row => row.status === 'PENDENTE');
  const transit = deliveries.items.filter(row => ['ENVIADO', 'EM_TRANSITO'].includes(row.status));
  const metrics = [
    { label: 'Solicitações pendentes', value: pending.length, href: '/fornecedor/solicitacoes' },
    { label: 'Envios para preparar', value: preparing.length, href: '/fornecedor/entregas' },
    { label: 'Envios em andamento', value: transit.length, href: '/fornecedor/entregas' },
  ];
  return <SupplierLayout title="Visão geral" description="Acompanhe os pedidos e envios da sua operação.">
    {(requests.error || deliveries.error) && <p className={styles.error} role="alert">{requests.error || deliveries.error}</p>}
    <div className={page.metrics}>{metrics.map(metric => <Link key={metric.label} href={metric.href} className={page.metric}><span>{metric.label}</span><strong>{requests.error || deliveries.error ? '—' : requests.loading || deliveries.loading ? '…' : metric.value}</strong><p>Entre os registros recentes carregados</p></Link>)}</div>
    <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Próximas solicitações</h2><p>Pedidos aguardando sua decisão.</p></div><Link className={styles.secondary} href="/fornecedor/solicitacoes">Ver todas</Link></header>
      {!requests.error && !requests.loading && pending.length === 0 ? <p className={styles.state}>Nenhuma solicitação pendente entre os registros recentes.</p> : requests.loading ? <p className={styles.state} role="status">Carregando solicitações…</p> : null}
      {pending.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Solicitações recentes" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Pedido</th><th scope="col">Item</th><th scope="col">Cinema</th><th scope="col">Quantidade</th><th scope="col">Data</th></tr></thead><tbody>{pendingPage.items.map(row => <tr key={row.id_solicitacao}><th scope="row">#{row.id_solicitacao}</th><td>{row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`}</td><td>{locations.name(row.id_local)}</td><td>{row.quantidade}</td><td>{dateTime(row.data_solicitacao)}</td></tr>)}</tbody></table></div>}
      <TablePagination list={pendingPage} noun="solicitações recentes" pageSizes={[5, 10, 20]} />{requests.nextCursor && <p className={styles.state}>Há mais registros. Consulte Solicitações para navegar pelos demais.</p>}
    </section>
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Cinemas autorizados</h2><p>Locais vinculados ao seu cadastro.</p></div><Link className={styles.secondary} href="/fornecedor/perfil">Ver perfil</Link></header><SupplierState list={locations} noun="cinemas" empty="Nenhum cinema autorizado." />{locations.items.length > 0 && <div className={styles.toolbar}>{locations.items.map(row => <span key={row.id_local} className={styles.badge}>{locations.name(row.id_local)}</span>)}</div>}</section>
  </SupplierLayout>;
}
