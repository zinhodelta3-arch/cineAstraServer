'use client';

import { useAdminReport, useReportRange } from '@/hooks/admin/use-admin-reports';
import ReportsLayout, { money, ReportFilters, ReportState } from './reports-layout';
import styles from '../catalog/catalog.module.css';

export default function SocialAdmin() {
  const range = useReportRange();
  const report = useAdminReport(range.applied ? `social?${new URLSearchParams(range.applied)}` : null);
  const data = report.data;
  return <ReportsLayout title="Destinação social" description="Acompanhe os parâmetros da destinação social do CineAstra.">
    <section className={styles.panel} aria-labelledby="social-title"><header className={styles.panelHeader}><div><h2 id="social-title">Apuração do período</h2><p>Período em UTC, incluindo as duas datas.</p></div></header>
      <ReportFilters range={range} onSubmit={range.commit} />
      {range.applied ? <ReportState report={report} /> : <p className={styles.state} role="status">Preparando período…</p>}
      {data && <div className={styles.pricingForm}><dl className={styles.detailGrid}><div><dt>Situação</dt><dd>{data.status === 'NOT_CALCULABLE' ? 'Valor ainda não calculável' : data.status}</dd></div><div><dt>Faixa prevista</dt><dd>{data.minPercent.replace('.', ',')}% a {data.maxPercent.replace('.', ',')}%</dd></div><div><dt>Base de cálculo</dt><dd>{data.basis}</dd></div><div><dt>Valor apurado</dt><dd>{data.amount == null ? 'Indisponível' : money(data.amount)}</dd></div></dl><p className={styles.notice}>{data.reason}</p></div>}
    </section>
  </ReportsLayout>;
}
