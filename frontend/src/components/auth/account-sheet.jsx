"use client";
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Ticket,Bell,UserRound,LogOut,ArrowUpRight,LayoutDashboard,X} from 'lucide-react';
import {Sheet,SheetTrigger,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {useAccountMenu} from '@/hooks/auth/use-account-menu';
import {sessionFetch,readSessionResponse} from '@/lib/auth/session-response.mjs';
import {useAccountPreferences} from '@/components/providers/account-preferences-provider';
import ProfileAvatar from '@/components/cinema/perfil/profile-avatar';
export default function AccountSheet({session}){
 const {user,message,pending,logout}=session,menu=useAccountMenu(user);
 const avatar=useAccountPreferences()?.data?.avatar;
 const [plan,setPlan]=useState(null),[planError,setPlanError]=useState(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  if(user.role!=='CLIENTE'||!menu.open)return;
  const abort=new AbortController();
  const load=()=>sessionFetch('/api/plans/current',{signal:abort.signal,credentials:'same-origin',cache:'no-store'}).then(readSessionResponse)
   .then(data=>{if(!abort.signal.aborted){setPlan(data.subscription);setPlanError(false);setLoaded(true);}})
   .catch(()=>{if(!abort.signal.aborted){setPlanError(true);setLoaded(true);}});
  load();
  window.addEventListener('cineastra:subscription-change',load);
  return()=>{abort.abort();window.removeEventListener('cineastra:subscription-change',load);};
 },[user.id,user.role,menu.open]);
 const links=[{label:'Minhas compras',href:'/cinema/minhascompras',icon:Ticket},{label:'Notificações',href:'/cinema/notificacao',icon:Bell},{label:menu.profilePath==='/streaming/meuperfil'?'Perfil do Streaming':'Perfil',href:menu.profilePath,icon:UserRound},...(menu.profilePath==='/streaming/meuperfil'?[{label:'Perfil geral',href:'/cinema/perfil',icon:UserRound}]:[]),...(user.role==='ADMIN'?[{label:'Administração',href:'/admin/dashboard',icon:LayoutDashboard}]:[]),...(['SUPERVISOR','COLABORADOR'].includes(user.role)?[{label:'Minha unidade',href:'/unidade',icon:LayoutDashboard}]:[]),...(user.role==='FORNECEDOR'?[{label:'Área do fornecedor',href:'/fornecedor',icon:LayoutDashboard}]:[])];
 return <Sheet open={menu.open} onOpenChange={menu.onOpenChange}>
  <SheetTrigger aria-label={`Abrir minha conta: ${user.name}`} title="Minha conta" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{avatar?<ProfileAvatar avatar={avatar} name={user.name} small />:menu.initials}</SheetTrigger>
  <SheetContent side="right" showCloseButton={false} className="z-[80] !w-[min(24rem,100vw)] gap-0 overflow-y-auto border-border bg-card pl-5 motion-reduce:transition-none">
   <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2 w-2 border-x border-dashed border-border"/>
   <SheetClose aria-label="Fechar minha conta" className="absolute right-4 top-4 grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><X className="size-5"/></SheetClose>
   <SheetHeader className="px-6 pb-8 pt-20"><div className="mb-5 flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xl font-bold text-primary" aria-hidden="true">{avatar?<ProfileAvatar avatar={avatar} name={user.name} small />:menu.initials}</div><SheetTitle className="break-words text-2xl font-bold leading-tight">{user.name}</SheetTitle><SheetDescription>Minha conta CineAstra</SheetDescription></SheetHeader>
   {user.role==='CLIENTE'&&<Link href="/cinema/planos#assinar" onClick={menu.close} className="mx-6 mb-4 block rounded-lg border border-border p-3 text-sm focus-visible:outline-2">
    <span className="block font-semibold">{planError?'Plano indisponível':plan?.planName??(loaded?'Sem plano ativo':'Consultando plano…')}</span>
    <span>{plan?.status==='SUSPENSA'?'Acesso suspenso · ':''}Gerenciar assinatura e benefícios</span>
   </Link>}
   <nav aria-label="Minha conta" className="mx-6 border-y border-dashed border-border py-4">{links.map(({label,href,icon:Icon})=><Link key={href} href={href} onClick={menu.close} className="group flex min-h-14 items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"><Icon className="size-5 shrink-0" aria-hidden="true"/><span>{label}</span><ArrowUpRight className="ml-auto size-4 text-muted-foreground group-hover:text-primary" aria-hidden="true"/></Link>)}</nav>
   <div className="mt-auto px-6 pb-8 pt-12">{message&&<p role="alert" className="mb-4 text-sm text-muted-foreground">{message}</p>}<button type="button" onClick={logout} disabled={pending} className="flex min-h-12 w-full items-center justify-between rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring"><span>{pending?'Saindo…':'Sair da conta'}</span><LogOut className="size-4" aria-hidden="true"/></button></div>
  </SheetContent>
 </Sheet>;
}
