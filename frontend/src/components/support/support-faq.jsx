import {Button} from '@/components/ui/button';
export default function SupportFaq({items,filtered,loading,error,retry}){
 return <section className="mx-auto w-full max-w-[1120px] rounded-2xl border border-border bg-card p-6 sm:p-8">
  <p className="text-xs font-bold uppercase tracking-widest text-primary">Central CineAstra</p>
  <h2 className="mt-2 text-3xl font-bold">Principais dúvidas</h2>
  {loading&&<p role="status" className="mt-5">Carregando dúvidas…</p>}
  {error&&<div role="alert" className="mt-5"><p>Não foi possível carregar o FAQ publicado.</p><Button variant="outline" className="mt-3" onClick={retry}>Tentar novamente</Button></div>}
  {!loading&&!error&&<div className="mt-5 grid gap-3 sm:grid-cols-2">
   {filtered.map((item,index)=><details key={index} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">{item.question}</summary><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{item.answer}</p></details>)}
   {!filtered.length&&<p>{items.length?'Nenhuma dúvida encontrada para esta pesquisa.':'Nenhuma dúvida publicada no momento.'}</p>}
  </div>}
 </section>;
}
