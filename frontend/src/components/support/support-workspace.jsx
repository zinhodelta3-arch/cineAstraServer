"use client";
import useSupportWorkspace from '@/hooks/cinema/suporte/use-support-workspace';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import ListStatus from '@/components/cinema/home/list-status';
import SupportAssistant from './support-assistant';
const statusLabels={ABERTO:'Aberto',EM_ATENDIMENTO:'Em atendimento',RESOLVIDO:'Resolvido',FECHADO:'Fechado'};
const field='mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60';
function stamp(value){
 if(!value)return null;
 const date=new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(value)?value:value.replace(' ','T')+'Z');
 return Number.isNaN(date.getTime())?null:date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
}
export default function SupportWorkspace(){
 const s=useSupportWorkspace(),ticket=s.detail.data;
 return <div className="mx-auto mt-7 w-full max-w-[1120px] space-y-7">
  {s.notice&&<p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4">{s.notice}</p>}
  {s.error&&<p role="alert" className="rounded-xl border border-destructive/40 p-4">{s.error}</p>}
  <div className="grid items-start gap-7 lg:grid-cols-2">
   <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
    <h2 className="text-2xl font-bold">Abrir chamado</h2>
    <p className="mt-2 text-sm text-muted-foreground">Descreva o que aconteceu. Não inclua senhas ou dados completos de pagamento.</p>
    <form className="mt-5 space-y-4" onSubmit={s.create}>
     <label className="block text-sm font-semibold">Assunto<Input className="mt-2" value={s.subject} onChange={e=>s.setSubject(e.target.value)} maxLength={150} required disabled={s.pending} /></label>
     <label className="block text-sm font-semibold">Mensagem inicial<textarea className={field} rows={5} value={s.message} onChange={e=>s.setMessage(e.target.value)} maxLength={10000} required disabled={s.pending} /></label>
     <Button type="submit" disabled={s.pending||!s.subject.trim()||!s.message.trim()}>Abrir chamado</Button>
    </form>
   </section>
   <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Meus chamados</h2><Button variant="outline" onClick={s.list.retry} disabled={s.list.loading||s.pending}>Atualizar chamados</Button></div>
    <ul className="mt-5 space-y-3">{s.list.items.map(item=><li key={item.id}><button type="button" disabled={s.pending} aria-pressed={s.selected===item.id} onClick={()=>s.select(item.id)} className="w-full rounded-xl border border-border p-4 text-left hover:border-primary aria-pressed:border-primary"><span className="block break-words font-semibold">#{item.id} · {item.subject}</span><span className="mt-1 block text-sm text-muted-foreground">{statusLabels[item.status]||item.status}</span></button></li>)}</ul>
    <ListStatus list={s.list} empty="Você ainda não possui chamados." more="Carregar mais chamados" />
   </section>
  </div>
  {s.selected&&<section className="rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="ticket-title">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="ticket-title" className="text-2xl font-bold">Conversa do chamado #{s.selected}</h2><Button variant="outline" onClick={s.refresh} disabled={s.pending||s.detail.loading||s.messages.loading}>Atualizar conversa</Button></div>
   {s.detail.loading&&<p role="status" className="mt-4">Carregando chamado…</p>}
   {s.detail.error&&<div role="alert" className="mt-4"><p>{s.detail.error}</p><Button onClick={s.detail.retry} variant="outline">Tentar novamente</Button></div>}
   {ticket&&<>
    <h3 className="mt-4 break-words font-semibold">{ticket.subject}</h3>
    <p className="mt-1 text-sm text-primary">{statusLabels[ticket.status]||ticket.status}</p>
    {ticket.responseDueAt&&<p className="mt-2 text-sm text-muted-foreground">Prazo de resposta informado: {stamp(ticket.responseDueAt)} (Brasília){ticket.responseOverdue?' · Prazo ultrapassado':''}</p>}
    <p className="mt-3 text-sm text-muted-foreground">Mensagens assíncronas, da mais antiga à mais recente. Use “Atualizar conversa” para consultar novas respostas.</p>
    <ol className="mt-5 space-y-3">{s.messages.items.map(item=><li key={item.id} className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-bold text-primary">{item.role==='CLIENTE'?'Cliente':item.role==='ADMIN'?'Atendimento':'Sistema'}{item.createdAt?' · '+stamp(item.createdAt):''}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p></li>)}</ol>
    <ListStatus list={s.messages} empty="Nenhuma mensagem disponível." more="Carregar próximas mensagens" />
    {ticket.status!=='FECHADO'&&<form onSubmit={s.sendReply} className="mt-5 space-y-3">
     <label className="block text-sm font-semibold">Sua resposta<textarea value={s.reply} onChange={e=>s.setReply(e.target.value)} className={field} rows={4} maxLength={10000} required disabled={s.pending} /></label>
     {ticket.status==='RESOLVIDO'&&<p className="text-sm text-muted-foreground">Enviar outra mensagem reabre este chamado.</p>}
     <Button type="submit" disabled={s.pending||!s.reply.trim()}>Enviar mensagem</Button>
    </form>}
    {ticket.status==='RESOLVIDO'&&<Button className="mt-4" variant="outline" disabled={s.pending} onClick={()=>s.setConfirmClose(true)}>Encerrar chamado</Button>}
   </>}
  </section>}
  <SupportAssistant {...s.assistant} />
  <Dialog open={s.confirmClose} onOpenChange={open=>{if(!s.pending)s.setConfirmClose(open);}}>
   <DialogContent><DialogHeader><DialogTitle>Encerrar chamado?</DialogTitle><DialogDescription>Confirme que sua solicitação foi resolvida. Após o encerramento, não será possível enviar mensagens neste chamado.</DialogDescription></DialogHeader>
    <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={s.pending} onClick={()=>s.setConfirmClose(false)}>Voltar</Button><Button disabled={s.pending} onClick={s.close}>Confirmar encerramento</Button></div>
   </DialogContent>
  </Dialog>
 </div>;
}
