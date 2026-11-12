'use client';

import { useRef, useState } from 'react';
import { History, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import TablePagination from '@/components/ui/table-pagination';
import { reportRequest, useAdminReport } from '@/hooks/admin/use-admin-reports';
import { money, ReportState, utcDateTime } from './reports-layout';
import styles from '../catalog/catalog.module.css';

const categories = {
  CARIDADE: 'Instituição de caridade',
  ONG: 'ONG',
  EMPRESA_VULNERAVEL: 'Empresa em situação de vulnerabilidade'
};

function DestinationForm({ row, onClose, onSaved }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const field = name => form.get(name).trim();
    const raw = field('amount').replace(',', '.');
    const resource = field('resource') || null;
    const accountingReference = field('accountingReference') || null;
    const [whole, cents = ''] = raw.split('.');
    const amount = raw ? `${whole}.${cents.padEnd(2, '0')}` : null;
    if (raw && (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(raw) || amount === '0.00')) {
      setError('Informe um valor positivo em reais, com até duas casas decimais.');
      return;
    }
    if (amount ? !resource || !accountingReference : accountingReference) {
      setError('Para registrar um valor, preencha o recurso, o valor e a referência contábil.');
      return;
    }

    lock.current = true;
    setPending(true);
    setError('');
    try {
      await reportRequest(row ? `destinations/${row.id}` : 'destinations', {
        method: row ? 'PATCH' : 'POST',
        body: {
          institution: field('institution'), category: field('category'), description: field('description'),
          purpose: field('purpose'), resource, amount, accountingReference,
          ...(row && { revision: row.revision })
        }
      });
    } catch (cause) {
      setError(cause.message);
      return;
    } finally {
      lock.current = false;
      setPending(false);
    }
    onSaved();
  }

  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{row ? 'Editar destinação' : 'Nova destinação'}</DialogTitle>
      <DialogDescription className={styles.dialogDescription}>Valores são registrados com base em documentação contábil. O cadastro não movimenta fundos.</DialogDescription>
      <form className={styles.form} onSubmit={submit}>
        <label>Instituição<input name="institution" required maxLength={150} defaultValue={row?.institution} /></label>
        <label>Categoria<select name="category" required defaultValue={row?.category ?? ''}>
          <option value="" disabled>Selecione</option>
          {Object.entries(categories).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
        </select></label>
        <label className={styles.wide}>Finalidade<textarea name="purpose" required maxLength={500} rows={2} defaultValue={row?.purpose} /></label>
        <label className={styles.wide}>Descrição<textarea name="description" required maxLength={1000} rows={3} defaultValue={row?.description} /></label>
        <label>Recurso<input name="resource" maxLength={150} defaultValue={row?.resource ?? ''} /></label>
        <label>Valor em reais<input name="amount" inputMode="decimal" maxLength={13} placeholder="0,00" defaultValue={row?.amount?.replace('.', ',') ?? ''} /></label>
        <label className={styles.wide}>Referência contábil<input name="accountingReference" maxLength={150} defaultValue={row?.accountingReference ?? ''} /></label>
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}>
          <button type="button" className={styles.secondary} disabled={pending} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar destinação'}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function DestinationHistory({ row, onClose }) {
  const list = useAdminReport(`destinations/${row.id}/history`);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>Histórico de destinação</DialogTitle>
      <DialogDescription className={styles.dialogDescription}>{row.institution}</DialogDescription>
      <ReportState report={list} />
      {list.items.map(({ revision, actorId, recordedAt, details }) => <details key={revision} className={styles.notice}>
        <summary>Versão {revision} · Admin #{actorId} · {utcDateTime(recordedAt)}</summary>
        <dl className={styles.detailGrid}>
          <div><dt>Instituição</dt><dd>{details.institution}</dd></div>
          <div><dt>Categoria</dt><dd>{categories[details.category]}</dd></div>
          <div><dt>Finalidade</dt><dd>{details.purpose}</dd></div>
          <div><dt>Descrição</dt><dd>{details.description}</dd></div>
          <div><dt>Recurso</dt><dd>{details.resource ?? '—'}</dd></div>
          <div><dt>Valor registrado</dt><dd>{money(details.amount)}</dd></div>
          <div><dt>Referência contábil</dt><dd>{details.accountingReference ?? '—'}</dd></div>
        </dl>
      </details>)}
      {list.data && <TablePagination list={list} noun="versões" />}
    </DialogContent>
  </Dialog>;
}

export default function SocialDestinations() {
  const list = useAdminReport('destinations');
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');
  const close = () => setDialog(null);
  return <section className={styles.panel} aria-labelledby="destinations-title">
    <header className={styles.panelHeader}>
      <div><h2 id="destinations-title">Destinações cadastradas</h2><p>Gerencie instituições beneficiárias, finalidades e recursos.</p></div>
      <button type="button" className={styles.primary} onClick={() => setDialog({ type: 'form' })}>
        <Plus size={16} aria-hidden="true" /> Nova destinação
      </button>
    </header>
    {message && <p className={styles.notice} role="status">{message}</p>}
    <ReportState report={list} />
    {list.data && !list.items.length && <p className={styles.state}>Nenhuma destinação cadastrada.</p>}
    {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Destinações cadastradas" tabIndex={0}>
      <table className={styles.table}>
        <thead><tr><th scope="col">Instituição</th><th scope="col">Categoria</th><th scope="col">Finalidade</th><th scope="col">Recurso</th><th scope="col">Valor registrado</th><th scope="col">Ações</th></tr></thead>
        <tbody>{list.items.map(row => <tr key={row.id}>
          <th scope="row">{row.institution}</th><td>{categories[row.category]}</td><td className="whitespace-normal break-words">{row.purpose}</td><td>{row.resource ?? '—'}</td><td>{money(row.amount)}</td>
          <td><div className={styles.actions}>
            <button type="button" className={styles.iconButton} title="Editar" aria-label={`Editar destinação de ${row.institution}`} onClick={() => setDialog({ type: 'form', row })}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" className={styles.iconButton} title="Histórico" aria-label={`Histórico de ${row.institution}`} onClick={() => setDialog({ type: 'history', row })}><History size={16} aria-hidden="true" /></button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {list.data && <TablePagination list={list} noun="destinações" />}
    {dialog?.type === 'form' && <DestinationForm row={dialog.row} onClose={close} onSaved={() => {
      setMessage(dialog.row ? 'Destinação atualizada.' : 'Destinação cadastrada.');
      close();
      list.reload();
    }} />}
    {dialog?.type === 'history' && <DestinationHistory row={dialog.row} onClose={close} />}
  </section>;
}
