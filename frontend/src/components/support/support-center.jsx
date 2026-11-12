"use client";
import Link from 'next/link';
import useSupportCenter from '@/hooks/cinema/suporte/use-support-center';
import {useSession} from '@/hooks/auth/use-session';
import SupportHeader from './support-header';
import SupportFaq from './support-faq';
import SupportWorkspace from './support-workspace';
export default function SupportCenter(){
 const {faq,...header}=useSupportCenter(),session=useSession();
 return <main className="relative min-h-[calc(100svh-81px)] bg-background px-4 pt-5 pb-14 text-foreground sm:px-6 sm:pt-8 sm:pb-20">
  <SupportHeader {...header} /><SupportFaq {...faq} />
  {session.loading?<p role="status" className="mx-auto mt-7 max-w-[1120px]">Verificando sua conta…</p>:session.user?.role==='CLIENTE'?<SupportWorkspace key={session.user.id} />:<div className="mx-auto mt-7 max-w-[1120px] rounded-xl border border-border bg-card p-4 sm:p-5">
   <h2 className="text-xl font-bold">Atendimento da sua conta</h2>
   <p className="mt-2 text-sm text-muted-foreground">{session.user?'Os chamados nesta página são destinados às contas de cliente.':'Entre para abrir chamados, consultar respostas e usar a assistente.'}</p>
   {!session.user&&<Link href="/auth/login" className="mt-2 inline-flex min-h-10 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Entrar para acessar o suporte</Link>}
   {session.user?.role==='ADMIN'&&<Link href="/admin/dashboard" className="mt-2 inline-flex min-h-10 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Ir para a área administrativa</Link>}
  </div>}
 </main>;
}
