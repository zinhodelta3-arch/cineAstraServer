'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { streamingAdminRequest } from '@/hooks/admin/use-admin-streaming';
import { planDate, planModalities } from '@/lib/api/plan-subscription.mjs';
import styles from '../catalog/catalog.module.css';

export default function SubscriptionAdminDialog({ mode, row, plans, onClose, onSaved }) {
  const [userId, setUserId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const creating = mode === 'create';
  const ending = mode === 'end';
  const renewal = mode === 'stop' || mode === 'enable';
  const proposing = mode === 'propose';
  const fieldsRequired = !ending && !renewal;
  const titles = { create: 'Nova proposta de assinatura', edit: 'Editar proposta', propose: 'Propor troca de assinatura', stop: 'Desativar renovação', enable: 'Retomar renovação', end: 'Encerrar assinatura' };
  const messages = {
    stop: 'O ciclo pago permanece válido. A renovação automática será desligada.',
    enable: 'A renovação será retomada conforme a autorização dada pelo titular.',
    end: row?.endsOn ? `Titular e participantes mantêm os benefícios até ${planDate(row.endsOn)}. As cobranças de ciclos futuros em aberto serão canceladas, e o histórico ficará disponível.` : 'A assinatura pendente será encerrada, e o histórico ficará disponível.',
    propose: 'O titular pode revisar o preço e os benefícios no perfil. Se ele aceitar, a troca será agendada para o próximo ciclo.',
    create: 'O titular revisa a oferta no perfil antes de confirmar a contratação.',
    edit: 'Altere a proposta enquanto aguarda o aceite do titular.'
  };
  const choices = plans.items.filter(plan => plan.active && plan.monthlyPrice && plan.annualPrice);

  async function save(event) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    if (creating && !userId) return setError('Selecione o cliente titular.');
    const fields = { planId: data.get('planId'), period: data.get('period'), modality: data.get('modality') };
    const body = ending ? undefined : renewal ? { action: mode === 'stop' ? 'stopRenewal' : 'enableRenewal' } :
      creating ? { ...fields, userId } : { ...fields, action: proposing ? 'proposeChange' : 'updateDraft' };
    lock.current = true;
    setPending(true);
    setError('');
    try {
      await streamingAdminRequest(creating ? 'subscriptions' : `subscriptions/${row.id}`, { method: ending ? 'DELETE' : creating ? 'POST' : 'PATCH', body });
      const confirmations = { end: row?.endsOn ? 'Encerramento programado para o fim do ciclo.' : 'Assinatura encerrada.', stop: 'Renovação automática desativada.', enable: 'Renovação automática retomada.', edit: 'Proposta atualizada.' };
      onSaved(confirmations[mode] ?? 'Proposta enviada ao titular.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{titles[mode]}</DialogTitle>
      <DialogDescription className={styles.dialogDescription}>{messages[mode]}</DialogDescription>
      <form className={styles.form} onSubmit={save}>
        {creating && <div className={styles.wide}><UserLookupFilter activeOnly label="Cliente titular" role="CLIENTE" value={userId} onChange={setUserId} /></div>}
        {fieldsRequired && <>
          <label>Plano<select name="planId" defaultValue={row?.planId ?? ''} required>
            <option value="">Selecione</option>
            {row?.planId && !choices.some(plan => plan.id === row.planId) && <option value={row.planId}>{row.plan}</option>}
            {choices.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select></label>
          <label>Modalidade<select name="modality" defaultValue={row?.modality ?? 'INDIVIDUAL'}>
            {planModalities.map(option => <option key={option.id} value={option.id}>{option.name} · {option.members} {option.members === 1 ? 'pessoa' : 'pessoas'}</option>)}
          </select></label>
          <label>Periodicidade<select name="period" defaultValue={row?.period ?? 'MENSAL'}><option value="MENSAL">Mensal</option><option value="ANUAL">Anual</option></select></label>
          {plans.nextCursor && <button type="button" className={styles.secondary} onClick={plans.loadMore} disabled={plans.loadingMore || pending}>Mais planos</button>}
          {plans.error && <button type="button" className={styles.secondary} onClick={plans.reload}>Recarregar planos</button>}
        </>}
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}>
          <button type="button" className={styles.secondary} disabled={pending} onClick={onClose}>Voltar</button>
          <button type="submit" className={ending ? styles.danger : styles.primary} disabled={pending || (fieldsRequired && plans.loading)}>{pending ? 'Salvando…' : fieldsRequired ? 'Salvar proposta' : titles[mode]}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
