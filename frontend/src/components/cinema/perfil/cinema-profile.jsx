"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Contact, ShieldCheck, Ticket } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSession } from '@/hooks/auth/use-session';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import useCinemaProfile from '@/hooks/cinema/perfil/use-cinema-profile';
import { sessionFetch, readSessionResponse } from '@/lib/auth/session-response.mjs';
import { subscriptionManagementPath } from '@/lib/auth/destination.mjs';
import { planDate, planPeriod, planStatus } from '@/lib/api/plan-subscription.mjs';
import ProfileOverview from './profile-overview';
import ProfileRecords from './profile-records';
import PasswordModal from './password-modal';
import Modal from './modal';
import AccountDeletion from './account-deletion';
import ticket from '../ticket.module.css';
import './cinema-profile.css';

async function readCurrentPlan(path, { signal }) {
  return readSessionResponse(await sessionFetch(path, { signal, credentials:'same-origin', cache:'no-store' }));
}

function ProfileSubscription() {
  const current = usePaginatedList('/api/plans/current', readCurrentPlan, { mode:'resource' });
  const plan = current.data?.subscription;
  const periodEnd = planDate(plan?.endsOn);
  return <section className={`${ticket.ticket} overflow-hidden`} aria-labelledby="profile-subscription">
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
      <div className="min-w-0 space-y-1">
        <h2 id="profile-subscription" className="text-sm font-semibold text-muted-foreground">Sua assinatura</h2>
        {current.loading ? <p role="status" className="text-sm">Consultando assinatura…</p> :
          current.error ? <p role="alert" className="text-sm">Não foi possível consultar a assinatura. <button type="button" className="font-semibold underline" onClick={current.reload}>Tentar novamente</button></p> :
          plan ? <>
            <p className={`${ticket.title} flex flex-wrap items-baseline gap-x-3 text-3xl font-black`}>{plan.planName}<span className="font-sans text-xs font-bold text-primary">{planStatus(plan)}</span></p>
            <p className="text-sm text-muted-foreground">{planPeriod(plan.period)}{periodEnd && ` · Ciclo até ${periodEnd}`}</p>
          </> : <p className={`${ticket.title} text-2xl font-bold`}>Sem plano ativo</p>}
      </div>
      <Link className={buttonVariants()} href={subscriptionManagementPath}>Gerenciar assinatura <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </section>;
}

function AccountSection({ title, description, icon: Icon, children }) {
  const [opened, setOpened] = useState(false);
  return <details className="ca-account-section" onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>
      <Icon size={20} aria-hidden="true" />
      <span><strong>{title}</strong><small>{description}</small></span>
      <ChevronDown size={17} className="ca-account-chevron" aria-hidden="true" />
    </summary>
    {opened && <div className="space-y-4 pb-4">{children}</div>}
  </details>;
}

function ProfileContent({ session }) {
  const { resource, saveProfile, notice } = useCinemaProfile();
  const client = session.user.role === 'CLIENTE';
  if (resource.loading) return <p role="status">Carregando seu perfil…</p>;
  if (resource.error) return <div role="alert"><p>{resource.error}</p><Button className="mt-4" onClick={resource.retry}>Tentar novamente</Button></div>;

  return <>
    {notice && <p role="status" className="mb-5 rounded-xl border border-primary/30 p-4 text-sm">{notice}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-9">
      <ProfileOverview profile={resource.data} saveProfile={saveProfile} />
      <div className="min-w-0 space-y-3">
        {client && <ProfileSubscription />}
        <AccountSection title="Dados e contato" description="Endereços e outros contatos" icon={Contact}>
          <ProfileRecords kind="addresses" />
          <ProfileRecords kind="contacts" />
        </AccountSection>
        <AccountSection title="Compras e pagamentos" description="Ingressos, pedidos e métodos de pagamento" icon={Ticket}>
          <Link href="/cinema/minhascompras" className="inline-flex items-center gap-2 font-semibold text-primary underline">Minhas compras <ArrowRight size={15} aria-hidden="true" /></Link>
          {client && <ProfileRecords kind="payment-methods" />}
        </AccountSection>
        <AccountSection title="Segurança e privacidade" description="Senha, sessão e dados da conta" icon={ShieldCheck}>
          <div className="flex flex-wrap gap-3">
            <PasswordModal />
            <Modal trigger={<Button variant="outline" disabled={session.pending}>Sair da conta</Button>} title="Sair da conta?" description="Sua sessão será encerrada neste navegador.">
              <Button onClick={session.logout} disabled={session.pending}>Confirmar saída</Button>
              {session.message && <p role="alert" className="text-sm">{session.message}</p>}
            </Modal>
          </div>
          {session.message && <p role="alert" className="text-sm">{session.message}</p>}
          {client && <AccountDeletion />}
        </AccountSection>
        <Link href="/cinema/suporte" className="inline-flex py-2 text-sm font-semibold text-primary hover:underline">Suporte</Link>
      </div>
    </div>
  </>;
}

export default function CinemaProfilePage() {
  const session = useSession();
  return <div className="ca-profile min-h-screen bg-background text-foreground"><main className="mx-auto max-w-[1440px] px-5 pt-8 pb-12 sm:px-8 lg:px-12 lg:pt-10">
    <Link href="/cinema/home" className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" aria-hidden="true" />Voltar ao cinema</Link>
    <h1 className="ca-display mb-5 text-5xl font-black uppercase sm:text-6xl">Minha <span className="text-primary">conta.</span></h1>
    <div className="ca-perf mb-7" aria-hidden="true" />
    {session.loading ? <p role="status">Verificando sua conta…</p> : session.user ? <ProfileContent key={session.user.id} session={session} /> :
      <section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-2xl font-bold">Acesse sua conta</h2><p className="my-4 text-sm text-muted-foreground">Entre para consultar e atualizar seus dados.</p><Link href="/auth/login" className="font-bold text-primary underline">Entrar para acessar o perfil</Link></section>}
  </main></div>;
}
