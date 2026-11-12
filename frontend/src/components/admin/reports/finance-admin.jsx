'use client';

import { useState } from 'react';
import { useAdminReport, useReportRange } from '@/hooks/admin/use-admin-reports';
import ReportsLayout, { count, money, ReportDetails, ReportFilters, ReportSection, ReportState } from './reports-layout';
import styles from '../catalog/catalog.module.css';
import reports from './reports.module.css';

const scopes = { ALL: 'Todas as operações', ORDERS: 'Pedidos', SUBSCRIPTIONS: 'Assinaturas' };

export default function FinanceAdmin() {
  const range = useReportRange();
  const [scope, setScope] = useState('ALL'), [appliedScope, setAppliedScope] = useState('ALL');
  const params = new URLSearchParams(range.applied ?? {}); params.set('scope', appliedScope);
  const report = useAdminReport(range.applied ? `finance?${params}` : null);
  const data = report.data;
  return <ReportsLayout title="Relatório financeiro" description="Consulte capturas, estornos e cobertura dos custos conhecidos.">
    <ReportSection id="finance-title" title="Movimento financeiro" description="Eventos registrados no período em UTC, incluindo as duas datas.">
      <ReportFilters range={range} onSubmit={() => { if (range.commit()) setAppliedScope(scope); }}><label className={styles.filter}>Escopo<select value={scope} onChange={event => setScope(event.target.value)}>{Object.entries(scopes).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></ReportFilters>
      {range.applied ? <ReportState report={report} /> : <p className={styles.state} role="status">Preparando período…</p>}
      {data && <div className={reports.body}>
        <p className={styles.hint}>{scopes[data.scope]}</p>
        <dl className={reports.metrics}>
          <div><dt>Movimento líquido</dt><dd>{money(data.netCashMovement)}</dd></div>
          <div><dt>Capturado</dt><dd>{money(data.grossCaptured)}</dd></div>
          <div><dt>Estornos confirmados</dt><dd>{money(data.confirmedRefunds)}</dd></div>
        </dl>
        <ReportDetails title="Operações do período" rows={[
          ['Capturas', count(data.captureCount)], ['Estornos confirmados', count(data.refundCount)],
          ['Pedidos', count(data.orderCount)], ['Cobranças de assinatura', count(data.subscriptionChargeCount)],
          ['Possíveis capturas duplicadas', count(data.duplicateCaptureCandidates)]
        ]} />
        <ReportDetails title="Custos e margem" rows={[
          ['Custo conhecido dos pedidos', data.knownOrderCost == null ? 'Indisponível neste escopo' : money(data.knownOrderCost)],
          ['Lucro líquido', 'Não apurado pelo sistema'],
          ['Pedidos com registro de precificação', count(data.orderSnapshotCount)],
          ['Pedidos sem registro de precificação', count(data.missingOrderSnapshots)],
          ['Itens sem custo', count(data.missingCostLines)],
          ['Alertas de margem', count(data.marginAlertLines)],
          ['Alertas de margem projetada', count(data.projectedMarginAlertLines)]
        ]} />
        {data.notes?.length > 0 && <div className={reports.notes}>{data.notes.map(note => <p key={note}>{note}</p>)}</div>}
      </div>}
    </ReportSection>
  </ReportsLayout>;
}
