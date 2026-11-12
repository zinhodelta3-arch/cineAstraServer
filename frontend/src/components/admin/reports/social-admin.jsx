'use client';

import { useAdminReport, useReportRange } from '@/hooks/admin/use-admin-reports';
import ReportsLayout, { money, ReportDetails, ReportFilters, ReportSection, ReportState } from './reports-layout';
import styles from '../catalog/catalog.module.css';
import reports from './reports.module.css';
import SocialDestinations from './social-destinations';

export default function SocialAdmin() {
  const range = useReportRange();
  const report = useAdminReport(range.applied ? `social?${new URLSearchParams(range.applied)}` : null);
  const data = report.data;
  return <ReportsLayout title="Destinação social" description="Gerencie as destinações e consulte os parâmetros de apuração do CineAstra.">
    <SocialDestinations />
    <ReportSection id="social-title" title="Apuração do período" description="Período em UTC, incluindo as duas datas.">
      <ReportFilters range={range} onSubmit={range.commit} />
      {range.applied ? <ReportState report={report} /> : <p className={styles.state} role="status">Preparando período…</p>}
      {data && <div className={reports.body}>
        <ReportDetails title="Cálculo da destinação" rows={[
          ['Situação', data.status === 'NOT_CALCULABLE' ? 'Valor ainda não calculável' : data.status],
          ['Faixa prevista', `${data.minPercent.replace('.', ',')}% a ${data.maxPercent.replace('.', ',')}%`],
          ['Base de cálculo', data.basis],
          ['Valor apurado', data.amount == null ? 'Indisponível' : money(data.amount)]
        ]} />
        <p className={reports.notes}>{data.reason}</p>
      </div>}
    </ReportSection>
  </ReportsLayout>;
}
