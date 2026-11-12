'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { streamingAdminRequest } from '@/hooks/admin/use-admin-streaming';
import styles from '../catalog/catalog.module.css';

export default function SubscriptionAdminDialog({ mode, row, plans, onClose, onSaved }) {
  const [userId, setUserId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const creating = mode === 'create';
  const stopping = mode === 'stop';
  const choices = plans.items.filter(plan => plan.active && plan.monthlyPrice && plan.annualPrice);

  async function save(event) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    if (creating && !userId) return setError('Selecione o cliente titular.');
    const fields = { planId: data.get('planId'), period: data.get('period') };
    const body = stopping ? { action: 'stopRenewal' } : creating ? { ...fields, userId } : { ...fields, action: 'updateDraft' };
    lock.current = true;
    setPending(true);
    setError('');
    try {
      await streamingAdminRequest(creating ? 'subscriptions' : `subscriptions/${row.id}`, { method: creating ? 'POST' : 'PATCH', body });
      onSaved(stopping ? 'Renovação automática desativada.' : creating ? 'Proposta registrada e disponível para o cliente.' : 'Proposta atualizada.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{stopping ? 'Desativar renovação' : creating ? 'Nova proposta de assinatura' : 'Editar proposta'}</DialogTitle>
      <DialogDescription className={styles.dialogDescription}>{stopping ? 'O período contratado e as cobranças já emitidas permanecem válidos.' : 'O cliente confere a oferta e aceita os termos na página de Planos antes da emissão da cobrança.'}</DialogDescription>
      <form className={styles.form} onSubmit={save}>
        {creating && <div className={styles.wide}><UserLookupFilter label="Cliente titular" role="CLIENTE" value={userId} onChange={setUserId} /></div>}
        {!stopping && <>
          <label>Plano<select name="planId" defaultValue={row?.planId ?? ''} required>
            <option value="">Selecione</option>
            {row?.planId && !choices.some(plan => plan.id === row.planId) && <option value={row.planId}>{row.plan}</option>}
            {choices.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select></label>
          <label>Periodicidade<select name="period" defaultValue={row?.period ?? 'MENSAL'}><option value="MENSAL">Mensal</option><option value="ANUAL">Anual</option></select></label>
          {plans.nextCursor && <button type="button" className={styles.secondary} onClick={plans.loadMore} disabled={plans.loadingMore || pending}>Mais planos</button>}
          {plans.error && <button type="button" className={styles.secondary} onClick={plans.reload}>Recarregar planos</button>}
        </>}
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}>
          <button type="button" className={styles.secondary} disabled={pending} onClick={onClose}>Voltar</button>
          <button type="submit" className={styles.primary} disabled={pending || (!stopping && plans.loading)}>{pending ? 'Salvando…' : stopping ? 'Confirmar' : 'Salvar proposta'}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
