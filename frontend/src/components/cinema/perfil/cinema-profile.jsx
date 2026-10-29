"use client";
import Link from 'next/link';
import {ArrowLeft,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useSession} from '@/hooks/auth/use-session';
import useCinemaProfile from '@/hooks/cinema/perfil/use-cinema-profile';
import ProfileOverview from './profile-overview';
import ProfileRecords from './profile-records';
import PasswordModal from './password-modal';
import Modal from './modal';
import './cinema-profile.css';
function ProfileContent({session}){
 const {resource,saveProfile,notice}=useCinemaProfile(),profile=resource.data;
 if(resource.loading)return <p role="status">Carregando seu perfil…</p>;
 if(resource.error)return <div role="alert"><p>{resource.error}</p><Button className="mt-4" onClick={resource.retry}>Tentar novamente</Button></div>;
 return <>
  {notice&&<p role="status" className="mb-5 rounded-xl border border-primary/30 p-4 text-sm">{notice}</p>}
  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
   <div className="order-2 min-w-0 space-y-6 lg:order-1">
    <ProfileRecords kind="addresses" />
    <ProfileRecords kind="contacts" />
    <section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Sua experiência</h2><div className="mt-4 flex flex-wrap gap-4"><Link href="/cinema/minhascompras" className="font-semibold text-primary underline">Minhas compras</Link><Link href="/cinema/planos" className="font-semibold text-primary underline">Minhas assinaturas</Link><Link href="/cinema/suporte" className="font-semibold text-primary underline">Suporte</Link></div><p className="mt-4 text-xs text-muted-foreground">Os favoritos de streaming pertencem a cada perfil de streaming. Esta página não exibe favoritos ou ingressos de demonstração.</p></section>
   </div>
   <aside aria-label="Informações da conta" className="order-1 space-y-6 lg:order-2">
    <ProfileOverview profile={profile} saveProfile={saveProfile} />
    {session.user.role==='CLIENTE'&&<ProfileRecords kind="payment-methods" />}
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5"><h2 className="text-xl font-bold">Segurança</h2><div className="flex flex-wrap gap-3"><PasswordModal />
     <Modal trigger={<Button variant="outline" disabled={session.pending}>Sair da conta</Button>} title="Sair da conta?" description="Sua sessão será encerrada neste navegador.">
      <Button onClick={session.logout} disabled={session.pending}>Confirmar saída</Button>
      {session.message&&<p role="alert" className="text-sm">{session.message}</p>}
     </Modal>
    </div>{session.message&&<p role="alert" className="text-sm">{session.message}</p>}</section>
   </aside>
  </div>
 </>;
}
export default function CinemaProfilePage(){
 const session=useSession();
 return <div className="ca-profile min-h-screen bg-background text-foreground"><main className="mx-auto max-w-[1440px] px-5 pt-8 pb-12 sm:px-8 lg:px-12 lg:pt-10">
  <Link href="/cinema/home" className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Voltar ao cinema</Link>
  <div className="mb-8"><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Sparkles className="size-4" />Sua experiência de cinema</p><h1 className="ca-display text-5xl font-black uppercase sm:text-6xl">Minha <span className="text-primary">conta.</span></h1><p className="mt-3 text-sm text-muted-foreground">Seus dados e formas de contato em um só lugar.</p></div>
  <div className="ca-perf mb-7" aria-hidden="true" />
  {session.loading?<p role="status">Verificando sua conta…</p>:session.user?<ProfileContent key={session.user.id} session={session} />:<section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-2xl font-bold">Acesse sua conta</h2><p className="my-4 text-sm text-muted-foreground">Entre para consultar e atualizar seus dados.</p><Link href="/auth/login" className="font-bold text-primary underline">Entrar para acessar o perfil</Link></section>}
 </main></div>;
}
