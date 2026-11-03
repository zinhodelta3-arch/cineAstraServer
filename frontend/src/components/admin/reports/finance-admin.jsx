'use client';

import { useState } from 'react';
import { useAdminReport, useReportRange } from '@/hooks/admin/use-admin-reports';
import ReportsLayout, { count, money, ReportFilters, ReportState } from './reports-layout';
import styles from '../catalog/catalog.module.css';

const scopes = { ALL: 'Todas as operações', ORDERS: 'Pedidos', SUBSCRIPTIONS: 'Assinaturas' };

export default function FinanceAdmin() {
  const range = useReportRange();
  const [scope, setScope] = useState('ALL'), [appliedScope, setAppliedScope] = useState('ALL');
  const params = new URLSearchParams(range.applied ?? {}); params.set('scope', appliedScope);
  const report = useAdminReport(range.applied ? `finance?${params}` : null);
  const data = report.data;
  const details = data ? [
    ['Capturas', count(data.captureCount)], ['Estornos confirmados', count(data.refundCount)],
    ['Pedidos', count(data.orderCount)], ['Cobranças de assinatura', count(data.subscriptionChargeCount)],
    ['Possíveis capturas duplicadas', count(data.duplicateCaptureCandidates)], ['Pedidos com snapshot', count(data.orderSnapshotCount)],
    ['Pedidos sem snapshot', count(data.missingOrderSnapshots)], ['Linhas sem custo', count(data.missingCostLines)],
    ['Alertas de margem', count(data.marginAlertLines)], ['Alertas de margem projetada', count(data.projectedMarginAlertLines)]
  ] : [];

  return <ReportsLayout title="Relatório financeiro" description="Consulte capturas, estornos e cobertura dos custos conhecidos.">
    <section className={styles.panel} aria-labelledby="finance-title"><header className={styles.panelHeader}><div><h2 id="finance-title">Movimento financeiro</h2><p>Eventos registrados no período em UTC, incluindo as duas datas.</p></div>{data && <span className={styles.count}>{scopes[data.scope]}</span>}</header>
      <ReportFilters range={range} onSubmit={() => { if (range.commit()) setAppliedScope(scope); }}><label className={styles.filter}>Escopo<select value={scope} onChange={event => setScope(event.target.value)}>{Object.entries(scopes).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></ReportFilters>
      {range.applied ? <ReportState report={report} /> : <p className={styles.state} role="status">Preparando período…</p>}
      {data && <><div className={`${styles.summaryGrid} ${styles.stockSummary}`}><div><span>Capturado</span><strong>{money(data.grossCaptured)}</strong></div><div><span>Estornos confirmados</span><strong>{money(data.confirmedRefunds)}</strong></div><div><span>Movimento líquido</span><strong>{money(data.netCashMovement)}</strong></div></div><div className={styles.pricingForm}><dl className={styles.detailGrid}>{details.map(([title, value]) => <div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}<div><dt>Custo conhecido dos pedidos</dt><dd>{data.knownOrderCost == null ? 'Não disponível neste escopo' : money(data.knownOrderCost)}</dd></div><div><dt>Lucro líquido</dt><dd>Não apurado pelo sistema</dd></div></dl></div>{data.notes?.length > 0 && <div className={styles.pricingForm}>{data.notes.map(note => <p key={note} className={styles.hint}>{note}</p>)}</div>}</>}
    </section>
  </ReportsLayout>;
}
