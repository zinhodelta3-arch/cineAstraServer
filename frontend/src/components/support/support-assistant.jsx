import {Bot} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export default function SupportAssistant({question,setQuestion,answer,asked,handedOff,ask,handoff,pending}){
 return <section className="rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="ai-support-title">
  <div className="flex items-center gap-3 text-primary"><Bot aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-widest">Assistente virtual · IA</span></div>
  <h2 id="ai-support-title" className="mt-3 text-2xl font-bold">Tire sua dúvida</h2>
  <p className="mt-2 text-sm text-muted-foreground">A assistente responde perguntas individuais. Não realiza compras nem altera sua conta. Evite enviar senhas e dados de cartão.</p>
  <form onSubmit={ask} className="mt-5 flex flex-wrap gap-3">
   <Input aria-label="Pergunta para a assistente" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1000} required disabled={pending} placeholder="Como posso ajudar?" className="min-w-0 flex-1" />
   <Button type="submit" disabled={pending||!question.trim()}>Perguntar à IA</Button>
  </form>
  {answer&&<div className="mt-5 space-y-3 rounded-xl border border-border bg-background p-4">
   <p className="break-words text-sm"><strong>Sua pergunta:</strong> {asked}</p>
   <p className="font-semibold">{answer.available?'Resposta da IA':'Assistente indisponível'}</p>
   <p className="whitespace-pre-wrap break-words text-sm leading-6">{answer.message}</p>
   <Button variant="outline" onClick={handoff} disabled={pending||handedOff}>{handedOff?'Encaminhado ao suporte':'Encaminhar esta dúvida ao suporte humano'}</Button>
  </div>}
 </section>;
}
