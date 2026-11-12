'use client';

import Link from 'next/link';
import { useSupplierList, useSupplierLocations } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { dateTime, SupplierState } from './supplier-layout';
import page from '@/components/admin/tabelaexemplo/example-table.module.css';
import styles from '@/components/admin/catalog/catalog.module.css';
import TablePagination from '@/components/ui/table-pagination';
import portal from './supplier-portal.module.css';

export default function SupplierOverview() {
  const requests = useSupplierList('requests?limit=100');
  const pendingPage = useSupplierList('requests?limit=10&status=PENDENTE');
  const deliveries = useSupplierList('logistics?limit=100');
  const locations = useSupplierLocations();
  const pending = requests.items.filter(row => row.status === 'PENDENTE');
  const preparing = deliveries.items.filter(row => row.status === 'PENDENTE');
  const transit = deliveries.items.filter(row => ['ENVIADO', 'EM_TRANSITO'].includes(row.status));
  const metrics = [
    { label: 'Solicitações pendentes', value: pending.length, href: '/fornecedor/solicitacoes' },
    { label: 'Envios para preparar', value: preparing.length, href: '/fornecedor/entregas' },
    { label: 'Envios em andamento', value: transit.length, href: '/fornecedor/entregas' },
  ];
  return <SupplierLayout title="Visão geral" description="Acompanhe os pedidos e envios da sua operação.">
    <div className={portal.overview}>
    {(requests.error || deliveries.error) && <p className={styles.error} role="alert">{requests.error || deliveries.error}</p>}
    <section className={page.metrics} aria-label="Indicadores dos registros carregados">{metrics.map(metric => <Link key={metric.label} href={metric.href} className={page.metric}><span>{metric.label}</span><strong>{requests.error || deliveries.error ? '—' : requests.loading || deliveries.loading ? '…' : metric.value}</strong><p>Entre os registros carregados</p></Link>)}</section>
    <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Próximas solicitações</h2><p>Pedidos aguardando sua decisão.</p></div><Link className={styles.secondary} href="/fornecedor/solicitacoes">Ver todas</Link></header>
      <SupplierState list={pendingPage} noun="solicitações" empty="Nenhuma solicitação pendente." />
      {pendingPage.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Solicitações pendentes" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Pedido</th><th scope="col">Item</th><th scope="col">Cinema</th><th scope="col">Quantidade</th><th scope="col">Data</th></tr></thead><tbody>{pendingPage.items.map(row => <tr key={row.id_solicitacao}><th scope="row">#{row.id_solicitacao}</th><td>{row.id_insumo ? `Insumo #${row.id_insumo}` : `Equipamento #${row.id_equipamento}`}</td><td>{locations.name(row.id_local)}</td><td>{row.quantidade}</td><td>{dateTime(row.data_solicitacao)}</td></tr>)}</tbody></table></div>}
      <TablePagination list={pendingPage} noun="solicitações pendentes" />
    </section>
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Cinemas autorizados</h2><p>Locais vinculados ao seu cadastro.</p></div><Link className={styles.secondary} href="/fornecedor/perfil">Ver perfil</Link></header><SupplierState list={locations} noun="cinemas" empty="Nenhum cinema autorizado." />{locations.items.length > 0 && <div className={styles.toolbar}>{locations.items.map(row => <span key={row.id_local} className={styles.badge}>{locations.name(row.id_local)}</span>)}</div>}</section>
    </div>
  </SupplierLayout>;
}
