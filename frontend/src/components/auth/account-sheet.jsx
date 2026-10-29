"use client";
import Link from 'next/link';
import {Ticket,Bell,UserRound,LogOut,ArrowUpRight,LayoutDashboard,X} from 'lucide-react';
import {Sheet,SheetTrigger,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {useAccountMenu} from '@/hooks/auth/use-account-menu';
export default function AccountSheet({session}){
 const {user,message,pending,logout}=session,menu=useAccountMenu(user);
 const links=[{label:'Minhas compras',href:'/cinema/minhascompras',icon:Ticket},{label:'Notificações',href:'/cinema/notificacao',icon:Bell},{label:'Perfil',href:menu.profilePath,icon:UserRound},...(user.role==='ADMIN'?[{label:'Administração',href:'/admin/dashboard',icon:LayoutDashboard}]:[])];
 return <Sheet open={menu.open} onOpenChange={menu.onOpenChange}>
  <SheetTrigger aria-label={`Abrir minha conta: ${user.name}`} title="Minha conta" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{menu.initials}</SheetTrigger>
  <SheetContent side="right" showCloseButton={false} className="z-[80] !w-[min(24rem,100vw)] gap-0 overflow-y-auto border-border bg-card pl-5 motion-reduce:transition-none">
   <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2 w-2 border-x border-dashed border-border"/>
   <SheetClose aria-label="Fechar minha conta" className="absolute right-4 top-4 grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><X className="size-5"/></SheetClose>
   <SheetHeader className="px-6 pb-8 pt-20"><div className="mb-5 flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xl font-bold text-primary" aria-hidden="true">{menu.initials}</div><SheetTitle className="break-words text-2xl font-bold leading-tight">{user.name}</SheetTitle><SheetDescription>Minha conta CineAstra</SheetDescription></SheetHeader>
   <nav aria-label="Minha conta" className="mx-6 border-y border-dashed border-border py-4">{links.map(({label,href,icon:Icon})=><Link key={href} href={href} onClick={menu.close} className="group flex min-h-14 items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"><Icon className="size-5 shrink-0" aria-hidden="true"/><span>{label}</span><ArrowUpRight className="ml-auto size-4 text-muted-foreground group-hover:text-primary" aria-hidden="true"/></Link>)}</nav>
   <div className="mt-auto px-6 pb-8 pt-12">{message&&<p role="alert" className="mb-4 text-sm text-muted-foreground">{message}</p>}<button type="button" onClick={logout} disabled={pending} className="flex min-h-12 w-full items-center justify-between rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring"><span>{pending?'Saindo…':'Sair da conta'}</span><LogOut className="size-4" aria-hidden="true"/></button></div>
  </SheetContent>
 </Sheet>;
}
