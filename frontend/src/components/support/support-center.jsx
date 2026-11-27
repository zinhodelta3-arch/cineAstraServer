"use client";
import Link from 'next/link';
import useSupportCenter from '@/hooks/cinema/suporte/use-support-center';
import {useSession} from '@/hooks/auth/use-session';
import SupportHeader from './support-header';
import SupportFaq from './support-faq';
import SupportWorkspace from './support-workspace';
import styles from './support-cinema.module.css';
export default function SupportCenter({ cinema = false, initialId, area = 'cinema' }){
 const {faq,...header}=useSupportCenter(area),session=useSession();
 if (cinema) return (
  <main className={styles.page}>
   <SupportHeader {...header} cinema area={area} session={session} />
   <SupportFaq {...faq} query={header.search} cinema />
   {session.user?.role === 'CLIENTE' && (
    <section id="chamados" className={styles.workspace} aria-label="Atendimento da sua conta">
     <SupportWorkspace key={`${session.user.id}:${initialId ?? ''}`} initialId={initialId} area={area} cinema />
    </section>
   )}
  </main>
 );
 return <main className="relative min-h-[calc(100svh-81px)] bg-background px-4 pt-5 pb-14 text-foreground sm:px-6 sm:pt-8 sm:pb-20">
  <SupportHeader {...header} cinema={cinema} area={area} /><SupportFaq {...faq} query={header.search} />
  {session.loading?<p role="status" className="mx-auto mt-7 max-w-[1120px]">Verificando sua conta…</p>:session.user?.role==='CLIENTE'?<SupportWorkspace key={`${session.user.id}:${initialId ?? ''}`} initialId={initialId} area={area} />:<div className="mx-auto mt-7 max-w-[1120px] rounded-xl border border-border bg-card p-4 sm:p-5">
   <h2 className="text-xl font-bold">Atendimento da sua conta</h2>
   <p className="mt-2 text-sm text-muted-foreground">{session.user?'Abra o suporte no painel da sua conta.':'Entre para abrir chamados, consultar respostas e usar a assistente.'}</p>
   {!session.user&&<Link href="/auth/login" className="mt-2 inline-flex min-h-10 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Entrar para acessar o suporte</Link>}
   {session.user?.role==='ADMIN'&&<Link href="/admin/suporte" className="mt-2 inline-flex min-h-10 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Abrir fila de suporte</Link>}
   {['SUPERVISOR','COLABORADOR','FORNECEDOR'].includes(session.user?.role)&&<Link href={session.user.role==='FORNECEDOR'?'/fornecedor/suporte':'/unidade/suporte'} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline">Abrir meus chamados</Link>}
  </div>}
 </main>;
}
