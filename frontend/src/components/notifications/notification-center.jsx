"use client";
import Link from 'next/link';
import {useSession} from '@/hooks/auth/use-session';
import useNotificationCenter from '@/hooks/cinema/notificacao/use-notification-center';
import styles from './notifications.module.css';
import Filmstrip from './filmstrip';
import ClapWatermark from './clap-watermark';
import NotificationHeader from './notification-header';
import NotificationDialog from './notification-dialog';
import NotificationGroup from './notification-group';
import NotificationSummary from './notification-summary';
import ListStatus from '@/components/cinema/home/list-status';
import {Button} from '@/components/ui/button';
function Feed({userId}){
 const s=useNotificationCenter(userId),list=s.list;
 return <>
  <div className={styles.contentGrid}>
   <div className={styles.feed}>
    <div className={styles.toolbar}><div className={styles.filters} role="group" aria-label="Filtrar notificações">{[['all','Todas'],['unread','Não lidas'],['read','Lidas']].map(([value,label])=><button key={value} type="button" aria-pressed={s.filter===value} className={s.filter===value?styles.activeFilter:''} onClick={()=>s.setFilter(value)}>{label}</button>)}</div><Button variant="outline" disabled={list.loading||list.pending} onClick={list.retry}>Atualizar notificações</Button></div>
    <p className="my-4 text-xs text-muted-foreground">Filtros e contadores consideram as {list.items.length} notificações carregadas.</p>
    {list.actionError&&<p role="alert" className="my-4 text-sm text-destructive">{list.actionError}</p>}
    {s.filter!=='read'&&<NotificationGroup title="Novas atividades" entries={s.unread} isNew openDetails={s.openDetails} toggleRead={s.markRead} pending={list.pending} />}
    {s.filter!=='unread'&&<NotificationGroup title="Atividades lidas" entries={s.read} openDetails={s.openDetails} toggleRead={s.markRead} pending={list.pending} />}
    {!list.loading&&!list.error&&list.items.length>0&&((s.filter==='read'&&!s.read.length)||(s.filter==='unread'&&!s.unread.length))&&<p className="my-6">Nenhum aviso carregado corresponde a este filtro.</p>}
    <ListStatus list={list} empty="Nenhuma notificação disponível." more="Carregar mais notificações" />
   </div>
   <NotificationSummary ready={!list.loading&&!list.error} unreadCount={list.unreadCount} />
  </div>
  <p role="status" className={styles.srOnly}>{s.announcement}</p>
  {s.selected&&<NotificationDialog item={list.items.find(item=>item.id===s.selected.id)||s.selected} onClose={s.closeDetails} onRead={()=>s.markRead(s.selected)} pending={list.pending} error={list.actionError} />}
 </>;
}
export default function NotificationCenter(){
 const session=useSession();
 return <main className={styles.root}><Filmstrip /><div className={styles.stage}><ClapWatermark /><div className={styles.container}>
  <nav className={styles.breadcrumb}><Link href="/cinema/home">Início</Link><span>/</span><span>Notificações</span></nav>
  <NotificationHeader />
  {session.loading?<p role="status">Verificando sua conta…</p>:session.user?<Feed key={session.user.id} userId={session.user.id} />:<section className="rounded-xl border border-border bg-card p-6"><p>Entre para consultar os avisos da sua conta.</p><Link href="/auth/login" className="mt-4 inline-block text-primary underline">Entrar para ver notificações</Link></section>}
  <footer className={styles.pageFooter}><span>CINEASTRA · CADA HISTÓRIA IMPORTA</span></footer>
 </div></div><Filmstrip /></main>;
}
