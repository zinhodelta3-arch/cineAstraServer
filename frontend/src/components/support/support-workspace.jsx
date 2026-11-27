"use client";
import {useEffect,useRef,useState} from 'react';
import { MessagesSquare, Ticket } from 'lucide-react';
import useSupportWorkspace from '@/hooks/cinema/suporte/use-support-workspace';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import ListStatus from '@/components/cinema/home/list-status';
import SupportAssistant from './support-assistant';
import ticketStyles from '@/components/cinema/ticket.module.css';
import styles from './support-cinema.module.css';
const statusLabels={ABERTO:'Aberto',EM_ATENDIMENTO:'Em atendimento',RESOLVIDO:'Resolvido',FECHADO:'Fechado',CANCELADO:'Cancelado'};
const field='mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60';
function stamp(value){
 if(!value)return null;
 const date=new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(value)?value:value.replace(' ','T')+'Z');
 return Number.isNaN(date.getTime())?null:date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
}
const roleNames={ADMIN:'Atendimento',CLIENTE:'Cliente',SUPERVISOR:'Supervisor',COLABORADOR:'Colaborador',FORNECEDOR:'Fornecedor'};
export default function SupportWorkspace({initialId,staffRole,area,cinema=false}){
 const s=useSupportWorkspace(initialId,area),ticket=s.detail.data;
 const [action,setAction]=useState(null);
 const listRegion=useRef(null), sentinel=useRef(null), thread=useRef(null);
 const canManage=staffRole==='SUPERVISOR'&&ticket?.status==='ABERTO';
 const {cursor,loading,error,loadMore}=s.list;
 useEffect(()=>{
  if(!cursor||loading||error||!listRegion.current||!sentinel.current||typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)loadMore();},{root:listRegion.current,rootMargin:'96px 0px'});
  observer.observe(sentinel.current);
  return()=>observer.disconnect();
 },[cursor,loading,error,loadMore]);
 useEffect(()=>{if(s.selected)thread.current?.scrollIntoView({block:'start'});},[s.selected]);
 const manage=async event=>{
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const complete=action==='edit'?await s.edit(form.get('subject'),form.get('message')):await s.cancel();
  if(complete)setAction(null);
 };
 const workspacePanel = 'min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6';
 const heading = cinema ? `${ticketStyles.title} ${styles.workspaceHeading}` : 'text-xl font-bold';
 return <div className={cinema ? styles.workspaceBody : 'mx-auto mt-7 w-full max-w-[1120px] space-y-7'}>
  {s.notice&&<p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4">{s.notice}</p>}
  {s.error&&<p role="alert" className="rounded-xl border border-destructive/40 p-4">{s.error}</p>}
  <div className={cinema ? styles.caseTicket : 'grid items-start gap-4 lg:grid-cols-2'}>
   <section className={cinema ? styles.caseForm : workspacePanel} aria-label="Abrir chamado">
    <h2 className={heading}>{cinema && <Ticket size={20} aria-hidden="true" />}Abrir chamado</h2>
    <p className="mt-2 text-sm text-muted-foreground">Descreva o que aconteceu. Não inclua senhas ou dados completos de pagamento.</p>
    <form className="mt-5 space-y-4" onSubmit={s.create}>
     <label className="block text-sm font-semibold">Assunto<Input className={cinema ? styles.caseField : 'mt-2'} value={s.subject} onChange={e=>s.setSubject(e.target.value)} maxLength={150} required disabled={s.pending} /></label>
     <label className="block text-sm font-semibold">Mensagem inicial<textarea className={cinema ? `${field} ${styles.caseField}` : field} rows={cinema ? 4 : 5} value={s.message} onChange={e=>s.setMessage(e.target.value)} maxLength={10000} required disabled={s.pending} /></label>
     <Button className={cinema ? 'min-h-11' : undefined} type="submit" disabled={s.pending||!s.subject.trim()||!s.message.trim()}>Abrir chamado</Button>
    </form>
   </section>
   <section className={cinema ? styles.caseHistory : workspacePanel} aria-label="Meus chamados">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className={heading}>{cinema && <MessagesSquare size={20} aria-hidden="true" />}Meus chamados</h2><Button variant="outline" onClick={s.list.retry} disabled={s.list.loading||s.pending}>Atualizar chamados</Button></div>
    <div ref={listRegion} className="mt-4 max-h-72 overflow-y-auto pr-1" tabIndex={0} role="region" aria-label="Lista de meus chamados"><ul className="space-y-1.5">{s.list.items.map(item=><li key={item.id}><button type="button" disabled={s.pending} aria-pressed={s.selected===item.id} onClick={()=>s.select(item.id)} className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/5 disabled:opacity-60"><span className="block break-words font-semibold">#{item.id} · {item.subject}</span><span className="mt-1 block text-sm text-muted-foreground">{statusLabels[item.status]||item.status}</span></button></li>)}</ul>
    <div ref={sentinel} aria-hidden="true" className="h-px" /></div>
    {s.list.error&&<div className="mt-3" role="alert"><p>{s.list.error}</p><Button variant="outline" onClick={cursor?s.list.loadMore:s.list.retry}>Tentar novamente</Button></div>}
    {s.list.loading&&<p className="mt-3" role="status">Carregando chamados…</p>}
    {!s.list.loading&&!s.list.error&&!s.list.items.length&&<p className="mt-3 text-sm text-muted-foreground">Você ainda não abriu chamados.</p>}
    {cursor&&<button type="button" className="sr-only focus:not-sr-only" disabled={s.list.loading} onClick={s.list.loadMore}>Carregar próximos chamados</button>}
   </section>
  </div>
  {s.selected&&<section ref={thread} className={cinema ? `${styles.workspaceCard} ${styles.thread}` : workspacePanel} aria-labelledby="ticket-title">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="ticket-title" className={cinema ? heading : 'text-2xl font-bold'}>Conversa do chamado #{s.selected}</h2><Button variant="outline" onClick={s.refresh} disabled={s.pending||s.detail.loading||s.messages.loading}>Atualizar conversa</Button></div>
   {s.detail.loading&&<p role="status" className="mt-4">Carregando chamado…</p>}
   {s.detail.error&&<div role="alert" className="mt-4"><p>{s.detail.error}</p><Button onClick={s.detail.retry} variant="outline">Tentar novamente</Button></div>}
   {ticket&&<>
    <h3 className="mt-4 break-words font-semibold">{ticket.subject}</h3>
    <p className="mt-1 text-sm text-primary">{statusLabels[ticket.status]||ticket.status}</p>
    {ticket.responseDueAt&&<p className="mt-2 text-sm text-muted-foreground">Prazo de resposta informado: {stamp(ticket.responseDueAt)} (Brasília){ticket.responseOverdue?' · Prazo ultrapassado':''}</p>}
    {canManage&&<div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>s.pending||setAction('edit')}>Editar chamado</Button><Button variant="outline" onClick={()=>s.pending||setAction('cancel')}>Cancelar chamado</Button></div>}
    <ol className="mt-5 space-y-3">{[...s.messages.items].reverse().map(item=><li key={item.id} className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-bold text-primary">{item.authorName??roleNames[item.role]??'Sistema'}{item.origin==='EDICAO'?' · Edição do chamado':''}{item.createdAt?' · '+stamp(item.createdAt):''}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p></li>)}</ol>
    <ListStatus list={s.messages} empty="Nenhuma mensagem disponível." more="Carregar mensagens anteriores" />
    {!['FECHADO','CANCELADO'].includes(ticket.status)&&<form onSubmit={s.sendReply} className="mt-5 space-y-3">
     <label className="block text-sm font-semibold">Sua resposta<textarea value={s.reply} onChange={e=>s.setReply(e.target.value)} className={field} rows={4} maxLength={10000} required disabled={s.pending} /></label>
     {ticket.status==='RESOLVIDO'&&<p className="text-sm text-muted-foreground">Enviar outra mensagem reabre este chamado.</p>}
     <Button type="submit" disabled={s.pending||!s.reply.trim()}>Enviar mensagem</Button>
    </form>}
    {ticket.status==='RESOLVIDO'&&<Button className="mt-4" variant="outline" disabled={s.pending} onClick={()=>s.setConfirmClose(true)}>Encerrar chamado</Button>}
   </>}
  </section>}
  {!staffRole&&<SupportAssistant {...s.assistant} cinema={cinema} />}
  <Dialog open={Boolean(action)} onOpenChange={open=>{if(!open&&!s.pending)setAction(null);}}>
   <DialogContent>
    <DialogHeader><DialogTitle>{action==='edit'?'Editar chamado':'Cancelar chamado?'}</DialogTitle><DialogDescription>O histórico da conversa permanece disponível.</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={manage}>
     {action==='edit'&&<><label className="block text-sm font-semibold">Assunto<Input className="mt-2" name="subject" defaultValue={ticket?.subject} maxLength={150} required /></label>
      <label className="block text-sm font-semibold">Mensagem inicial<textarea className={field} name="message" defaultValue={ticket?.initialMessage} rows={5} maxLength={10000} required /></label></>}
     {s.error&&<p role="alert" className="text-sm text-destructive">{s.error}</p>}
     <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" onClick={()=>setAction(null)} disabled={s.pending}>Voltar</Button>
      <Button type="submit" variant={action==='cancel'?'destructive':'default'} disabled={s.pending}>{action==='edit'?'Salvar alterações':'Confirmar cancelamento'}</Button></div>
    </form>
   </DialogContent>
  </Dialog>
  <Dialog open={s.confirmClose} onOpenChange={open=>{if(!s.pending)s.setConfirmClose(open);}}>
   <DialogContent><DialogHeader><DialogTitle>Encerrar chamado?</DialogTitle><DialogDescription>Confirme que sua solicitação foi resolvida. Após o encerramento, não será possível enviar mensagens neste chamado.</DialogDescription></DialogHeader>
    <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={s.pending} onClick={()=>s.setConfirmClose(false)}>Voltar</Button><Button disabled={s.pending} onClick={s.close}>Confirmar encerramento</Button></div>
   </DialogContent>
  </Dialog>
 </div>;
}
