"use client";
import Link from 'next/link';
import {useSession} from '@/hooks/auth/use-session';
import AccountSheet from './account-sheet';
function Controls({session}){
 const {user,loading,message}=session;
 if(loading)return <span className="text-xs text-muted-foreground" role="status">Verificando sessão…</span>;
 if(user)return <AccountSheet session={session}/>;
 return <div className="flex flex-wrap items-center gap-2 text-xs"><Link href="/auth/login" className="rounded border border-border px-3 py-2 font-semibold">Entrar</Link><Link href="/auth/cadastro" className="rounded bg-primary px-3 py-2 font-semibold text-primary-foreground">Criar conta</Link>{message&&<span role="status" className="w-full text-xs text-muted-foreground">{message}</span>}</div>;
}
function StandaloneControls(){const session=useSession();return <Controls session={session}/>;}
export default function SessionControls({session}={}){return session?<Controls session={session}/>:<StandaloneControls/>;}
