"use client";
import Link from 'next/link';
import useSupportCenter from '@/hooks/cinema/suporte/use-support-center';
import {useSession} from '@/hooks/auth/use-session';
import SupportHeader from './support-header';
import SupportFaq from './support-faq';
import SupportWorkspace from './support-workspace';
export default function SupportCenter(){
 const {faq,...header}=useSupportCenter(),session=useSession();
 return <main className="relative min-h-[calc(100svh-81px)] overflow-hidden bg-background px-3 pt-[30px] pb-[60px] text-foreground min-[601px]:px-5 min-[601px]:pt-[42px] min-[601px]:pb-20">
  <SupportHeader {...header} /><SupportFaq {...faq} />
  {session.loading?<p role="status" className="mx-auto mt-7 max-w-[1120px]">Verificando sua conta…</p>:session.user?.role==='CLIENTE'?<SupportWorkspace key={session.user.id} />:<div className="mx-auto mt-7 max-w-[1120px] rounded-2xl border border-border bg-card p-6">
   <h2 className="text-2xl font-bold">Atendimento da sua conta</h2>
   <p className="mt-3 text-sm text-muted-foreground">{session.user?'Os chamados nesta página são destinados às contas de cliente.':'Entre para abrir chamados, consultar respostas e usar a assistente.'}</p>
   {!session.user&&<Link href="/auth/login" className="mt-4 inline-block font-bold text-primary underline">Entrar para acessar o suporte</Link>}
   {session.user?.role==='ADMIN'&&<Link href="/admin/dashboard" className="mt-4 inline-block font-bold text-primary underline">Ir para a área administrativa</Link>}
  </div>}
 </main>;
}
