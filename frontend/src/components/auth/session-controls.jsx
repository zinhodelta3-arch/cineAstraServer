"use client";
import Link from 'next/link';
import { useSession } from '@/hooks/auth/use-session';
export default function SessionControls() {
 const {user,loading,message,pending,logout}=useSession();
 if(loading)return <span className="text-xs text-muted-foreground" role="status">Verificando sessão…</span>;
 return <div className="flex flex-wrap items-center gap-2 text-xs">
  {user ? <><span>{user.name}{user.role==='CLIENTE'&&!user.ageVerified&&<small className="block text-muted-foreground">Idade não verificada</small>}</span>{user.role==='ADMIN'&&<Link href="/admin/dashboard" className="rounded border border-border px-3 py-2 font-semibold">Administração</Link>}<button type="button" disabled={pending} onClick={logout} className="rounded border border-border px-3 py-2 font-semibold">{pending?'Saindo…':'Sair'}</button></> : <><Link href="/auth/login" className="rounded border border-border px-3 py-2 font-semibold">Entrar</Link><Link href="/auth/cadastro" className="rounded bg-primary px-3 py-2 font-semibold text-primary-foreground">Criar conta</Link></>}
  {message&&<span role="status" className="w-full text-xs text-muted-foreground">{message}</span>}
 </div>;
}
