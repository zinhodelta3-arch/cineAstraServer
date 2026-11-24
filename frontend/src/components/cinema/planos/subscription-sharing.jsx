'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { readSessionResponse, sessionFetch } from '@/lib/auth/session-response.mjs';
import { planDate, planMoney, planPeriod } from '@/lib/api/plan-subscription.mjs';
import ticket from '../ticket.module.css';

const modes = { TITULAR_PAGA: 'Titular paga', DIVISAO_IGUAL: 'Divisão igual' };
const invitationStates = { PENDENTE: 'Aguardando resposta', ACEITO: 'Aceito', RECUSADO: 'Recusado', EXPIRADO: 'Encerrado' };
const control = 'min-h-10 rounded-lg border border-border bg-card px-3';

async function request(path, { signal, method = 'GET', body } = {}) {
  return readSessionResponse(await sessionFetch(`/api/subscription-sharing/${path}`, {
    cache: 'no-store', method, signal,
    ...(body != null && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  }));
}

function useSharingAction(reload) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function run(path, message, body) {
    if (lock.current) return false;
    lock.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      await request(path, { method: 'POST', body });
      reload();
      window.dispatchEvent(new Event('cineastra:subscription-change'));
      setNotice(message);
      return true;
    } catch (cause) {
      setError(cause.message);
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return { pending, error, notice, run };
}

function Feedback({ action }) {
  return <>
    {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
    {action.notice && <p role="status" className="text-sm">{action.notice}</p>}
  </>;
}

function DivisionControls({ id, members, userId, active, revision, action }) {
  const prefix = `subscriptions/${id}`;
  const proposal = usePaginatedList(`${prefix}/division-proposals/pending`, request, { mode: 'resource', refreshKey: revision });
  const [previewOpen, setPreviewOpen] = useState(false);
  const nextCycle = usePaginatedList(previewOpen ? `${prefix}/next-cycle` : null, request, { mode: 'resource', refreshKey: revision });
  const vote = proposal.data?.proposal;
  const owner = members.ownerId === userId;
  const otherMode = members.divisionMode === 'TITULAR_PAGA' ? 'DIVISAO_IGUAL' : 'TITULAR_PAGA';
  const myShare = nextCycle.data?.shares.find(share => share.userId === userId);
  return <div className="space-y-3 border-t border-dashed border-border pt-4">
    <h4 className="text-base font-bold">Pagamento do grupo</h4>
    <p className="text-sm">{modes[members.divisionMode]}</p>
    {members.scheduledMode && <p className="text-sm text-muted-foreground">Agendado para {planDate(members.scheduledCompetence)} · {modes[members.scheduledMode]}</p>}
    {proposal.error && <p role="alert" className="text-sm text-destructive">{proposal.error} <Button size="sm" variant="outline" onClick={proposal.reload}>Tentar novamente</Button></p>}
    {vote && <div className="space-y-2">
      <p className="text-sm">Proposta para {planDate(vote.effectiveCompetence)} · {modes[vote.divisionMode]}.</p>
      {active && vote.myConsent === 'PENDENTE' ? <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={action.pending} onClick={() => action.run(`${prefix}/division-proposals/${vote.id}/consent`, 'Voto registrado.', { accept: true })}>Aceitar proposta</Button>
        <Button size="sm" variant="outline" disabled={action.pending} onClick={() => action.run(`${prefix}/division-proposals/${vote.id}/consent`, 'Voto registrado.', { accept: false })}>Recusar proposta</Button>
      </div> : <p className="text-sm text-muted-foreground">Aguardando a decisão do grupo.</p>}
    </div>}
    <div className="flex flex-wrap gap-2">
      {active && owner && proposal.data && !vote && !members.scheduledMode && <Button size="sm" variant="outline" disabled={action.pending}
        onClick={() => action.run(`${prefix}/division-proposals`, 'Proposta registrada para o próximo ciclo.', { divisionMode: otherMode })}>Propor {modes[otherMode].toLocaleLowerCase('pt-BR')}</Button>}
      {active && <Button size="sm" variant="ghost" aria-expanded={previewOpen} onClick={() => setPreviewOpen(value => !value)}>Prévia da próxima cobrança</Button>}
    </div>
    {previewOpen && nextCycle.loading && <p role="status" className="text-sm">Consultando o próximo ciclo…</p>}
    {previewOpen && nextCycle.error && <p role="alert" className="text-sm text-destructive">{nextCycle.error} <Button size="sm" variant="outline" onClick={nextCycle.reload}>Tentar novamente</Button></p>}
    {myShare && <p className="text-sm">Sua cota estimada em {planDate(nextCycle.data.competence)} é de <strong>{planMoney(myShare.amount)}</strong>.</p>}
  </div>;
}

export function SubscriptionParticipants({ item, userId, shared = false }) {
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState(null);
  const prefix = `subscriptions/${item.id}`;
  const resource = usePaginatedList(open ? `${prefix}/participants` : null, request, { mode: 'resource', refreshKey: revision });
  const action = useSharingAction(() => setRevision(value => value + 1));
  const members = resource.data;
  const owner = members?.ownerId === userId;
  const active = !item.endingOn;
  const participants = members?.participants.filter(row => row.status !== 'SAIU') ?? [];
  const invitations = members?.invitations ?? [];
  const used = 1 + participants.length + invitations.length;
  async function invite(event) {
    event.preventDefault();
    if (await action.run(`${prefix}/invitations`, 'Convite enviado.', { email: email.trim() })) setEmail('');
  }
  return <div className={shared ? 'mt-3' : 'border-t border-dashed border-border px-4 py-4 sm:px-7'}>
    <Button type="button" variant="outline" aria-expanded={open} onClick={() => { setOpen(value => !value); setConfirm(null); }}>Participantes e rateio</Button>
    {open && <div className="mt-4 space-y-4">
      {resource.loading && <p role="status" className="text-sm">Consultando participantes…</p>}
      {resource.error && <p role="alert" className="text-sm text-destructive">{resource.error} <Button size="sm" variant="outline" onClick={resource.reload}>Tentar novamente</Button></p>}
      <Feedback action={action} />
      {members && <>
        <h3 className="text-lg font-bold">Participantes do plano</h3>
        <p className="text-sm text-muted-foreground">{used} de {members.maxMembers} lugares ocupados, incluindo o titular{owner && invitations.length > 0 ? ' e convites pendentes' : ''}.</p>
        {participants.length > 0 && <ul className="divide-y divide-border">
          {participants.map(row => <li key={row.userId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span>{row.name ?? `Participante #${row.userId}`}{row.status === 'SUSPENSO' && ' · Acesso suspenso'}</span>
            {owner && active && <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={action.pending} onClick={() => action.run(`${prefix}/participants/${row.userId}/${row.status === 'SUSPENSO' ? 'resume' : 'suspend'}`, 'Participação atualizada.')}>{row.status === 'SUSPENSO' ? 'Reativar' : 'Suspender'}</Button>
              <Button size="sm" variant="ghost" disabled={action.pending} onClick={() => setConfirm(row)}>Remover</Button>
            </div>}
          </li>)}
        </ul>}
        {confirm && <div className="flex flex-wrap items-center gap-2 text-sm">
          <p>Remover {confirm.name} da assinatura?</p>
          <Button size="sm" variant="destructive" disabled={action.pending} onClick={async () => { if (await action.run(`${prefix}/participants/${confirm.userId}/remove`, 'Participante removido.')) setConfirm(null); }}>Confirmar remoção</Button>
          <Button size="sm" variant="ghost" disabled={action.pending} onClick={() => setConfirm(null)}>Voltar</Button>
        </div>}
        {owner && invitations.length > 0 && <ul className="divide-y divide-border">
          {invitations.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span>{row.name} · Convite pendente</span>
            <Button size="sm" variant="outline" disabled={action.pending} onClick={() => action.run(`${prefix}/invitations/${row.id}/cancel`, 'Convite cancelado.')}>Cancelar convite</Button>
          </li>)}
        </ul>}
        {owner && active && used < members.maxMembers && <form className="flex flex-wrap items-end gap-2" onSubmit={invite}>
          <label className="grid min-w-0 flex-1 gap-1 text-sm">E-mail da conta convidada
            <input className={control} type="email" maxLength={150} required value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <Button type="submit" disabled={action.pending}>Convidar participante</Button>
        </form>}
        <DivisionControls id={item.id} members={members} userId={userId} active={active} revision={revision} action={action} />
      </>}
    </div>}
  </div>;
}

export function SubscriptionInvitations({ userId, onPayment }) {
  const list = usePaginatedList('invitations?limit=20', request);
  const action = useSharingAction(list.reload);
  const [leave, setLeave] = useState(null);
  return <section id="convites" className={`${ticket.ticket} scroll-mt-24 space-y-4 p-5 sm:p-7`}>
    <h2 className={`${ticket.title} text-2xl font-bold`}>Convites e assinaturas compartilhadas</h2>
    <Feedback action={action} />
    {list.loading && <p role="status" className="text-sm">Consultando convites…</p>}
    {list.error && <p role="alert" className="text-sm text-destructive">{list.error} <Button size="sm" variant="outline" onClick={list.reload}>Tentar novamente</Button></p>}
    {!list.error && !list.loading && !list.items.length && <p className="text-sm text-muted-foreground">Você ainda não recebeu convites de assinatura.</p>}
    {list.items.map(item => <article key={item.id} className="space-y-2 border-t border-dashed border-border pt-4">
      <h3 className="font-bold">{item.planName} · {item.ownerName}</h3>
      <p className="text-sm text-muted-foreground">{invitationStates[item.status]}{item.membership === 'SAIU' ? ' · Participação encerrada' : ''}{item.membership === 'SUSPENSO' ? ' · Participação suspensa' : ''}</p>
      {item.status === 'PENDENTE' && <>
        <p className="text-sm">{modes[item.divisionMode]} · {planMoney(item.contractPrice)} por ciclo {planPeriod(item.period).toLowerCase()}{item.divisionMode === 'DIVISAO_IGUAL' ? '. Sua cota é calculada a partir do próximo ciclo.' : '.'}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={action.pending} onClick={() => action.run(`invitations/${item.id}/accept`, 'Convite aceito.')}>Aceitar convite</Button>
          <Button size="sm" variant="outline" disabled={action.pending} onClick={() => action.run(`invitations/${item.id}/decline`, 'Convite recusado.')}>Recusar convite</Button>
        </div>
      </>}
      {item.status === 'ACEITO' && (item.hasCharge || ['ATIVO', 'SUSPENSO'].includes(item.membership)) && <div className="flex flex-wrap gap-2">
        {item.hasCharge && <Button size="sm" variant="outline" onClick={() => onPayment(item.subscriptionId)}>Ver minha cobrança</Button>}
        {['ATIVO', 'SUSPENSO'].includes(item.membership) && <Button size="sm" variant="ghost" onClick={() => setLeave(item)}>Sair da assinatura</Button>}
      </div>}
      {leave?.id === item.id && <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm">Você perderá os benefícios desta participação.</p>
        <Button size="sm" variant="destructive" disabled={action.pending} onClick={async () => { if (await action.run(`subscriptions/${item.subscriptionId}/participants/me/leave`, 'Participação encerrada.')) setLeave(null); }}>Confirmar saída</Button>
        <Button size="sm" variant="ghost" disabled={action.pending} onClick={() => setLeave(null)}>Voltar</Button>
      </div>}
      {item.status === 'ACEITO' && ['ATIVO', 'SUSPENSO'].includes(item.membership) && <SubscriptionParticipants item={{ id: item.subscriptionId, endingOn: item.endingOn }} userId={userId} shared />}
    </article>)}
    {(list.page > 1 || list.hasNext) && <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={list.loading || list.page === 1} onClick={list.previousPage}>Anteriores</Button>
      <Button size="sm" variant="outline" disabled={list.loading || !list.hasNext} onClick={list.nextPage}>Próximos</Button>
    </div>}
  </section>;
}
