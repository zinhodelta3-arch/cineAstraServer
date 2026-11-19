'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import TablePagination from '@/components/ui/table-pagination';
import { reportRequest, useAdminReport } from '@/hooks/admin/use-admin-reports';
import ReportsLayout, { money, ReportState } from './reports-layout';
import styles from '../catalog/catalog.module.css';
import reports from './reports.module.css';
import SocialDestinations from './social-destinations';

export default function SocialAdmin() {
  const initiatives = useAdminReport('initiatives');
  const destinations = useAdminReport('destinations?limit=100');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const now = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);

  async function submit(event, id) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const input = new FormData(form);
    const proofUrl = input.get('proofUrl').trim() || null;
    setSaving(true);
    setNotice(null);
    try {
      await reportRequest(id ? 'initiatives/' + id : 'initiatives', {
        method: id ? 'PATCH' : 'POST',
        body: id ? { proofUrl } : { month: input.get('month'), destinationId: input.get('destinationId'), proofUrl },
      });
      if (!id) form.reset();
      setNotice({ message: id ? 'Comprovação atualizada.' : 'Iniciativa publicada.' });
      initiatives.reload();
    } catch (cause) { setNotice({ error: cause.message }); }
    finally { setSaving(false); }
  }

  return <ReportsLayout title="Destinação social" description="O CineAstra destina 1% dos pedidos pagos na competência, sem alterar o total do cliente.">
    <section className={styles.panel}>
      <header className={styles.panelHeader}><div><h2>Iniciativas mensais</h2><p>Uma instituição por mês. Valores consideram pagamentos e reembolsos confirmados.</p></div></header>
      {notice && <p role={notice.error ? 'alert' : 'status'} className={notice.error ? styles.error : styles.notice}>{notice.error || notice.message}</p>}
      <form className={`${styles.form} ${reports.editor}`} onSubmit={event => submit(event, null)}>
        <label>Competência<input type="month" name="month" min={now} defaultValue={now} required /></label>
        <label>Instituição cadastrada<select name="destinationId" defaultValue="" required>
          <option value="" disabled>Selecione uma destinação</option>
          {destinations.items.map(item => <option key={item.id} value={item.id}>{item.institution} · {item.purpose}</option>)}
        </select></label>
        <label className={styles.wide}>Link público da comprovação (opcional)<input type="url" name="proofUrl" maxLength={2048} placeholder="https://" /></label>
        <div className={`${styles.dialogActions} ${styles.wide}`}>
          {destinations.hasNext && <button type="button" className={styles.secondary} onClick={destinations.loadMore}>Carregar mais instituições</button>}
          <button type="submit" className={styles.primary} disabled={saving || !destinations.items.length}>Publicar iniciativa</button>
        </div>
      </form>
      <ReportState report={destinations} />
      <ReportState report={initiatives} />
      {initiatives.data && !initiatives.items.length && <p className={styles.state}>Nenhuma iniciativa publicada.</p>}
      <div className="grid gap-3">
        {initiatives.items.map(item => <article key={item.id} className={styles.notice}>
          <h3 className="font-bold">{item.month} · {item.institution}</h3>
          <p>{item.active ? 'Ativa' : item.month > now ? 'Agendada' : 'Encerrada'}{item.simulated ? ' · Simulação' : ''}</p>
          <dl className={styles.detailGrid}>
            <div><dt>Destinado</dt><dd>{money(item.gross)}</dd></div>
            <div><dt>Ajustes de reembolso</dt><dd>{money(item.adjustments)}</dd></div>
            <div><dt>Saldo líquido</dt><dd>{money(item.amount)}</dd></div>
          </dl>
          {item.proofUrl && <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-primary underline">Ver comprovação <ExternalLink size={14} aria-hidden="true" /></a>}
          <form className={`${styles.form} ${reports.editor}`} onSubmit={event => submit(event, item.id)}>
            <label>Link da comprovação<input type="url" name="proofUrl" maxLength={2048} defaultValue={item.proofUrl || ''} /></label>
            <button type="submit" disabled={saving} className={styles.secondary}>Atualizar comprovação</button>
          </form>
        </article>)}
      </div>
      <TablePagination list={initiatives} noun="iniciativas" />
    </section>
    <SocialDestinations />
  </ReportsLayout>;
}
