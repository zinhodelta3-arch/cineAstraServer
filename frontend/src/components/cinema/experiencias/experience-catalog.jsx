import {Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ListStatus from '@/components/cinema/home/list-status';
export default function ExperienceCatalog({catalog}){
 return <section id="experiencias" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
  <h2 className="f-display mb-9 text-5xl font-black sm:text-6xl">Conheça as experiências<span className="text-primary">.</span></h2>
  <div className="grid gap-5 lg:grid-cols-3">{catalog.experiences.map(e=><article key={e.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
   <div className="relative flex aspect-[5/3] items-center justify-center bg-muted">{e.imageUrl?<img src={e.imageUrl} alt={e.imageAlt||e.title} loading="lazy" className="h-full w-full object-cover"/>:<Sparkles className="size-12 text-primary"/>}{e.tag&&<span className="absolute left-4 top-4 rounded-full bg-background px-3 py-1 text-xs font-semibold">{e.tag}</span>}</div>
   <div className="flex flex-1 flex-col p-6"><h3 className="f-display text-3xl font-black">{e.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{e.summary}</p>{e.priceLabel&&<div className="my-5 border-y border-dashed border-border py-4"><p className="font-bold text-primary">{e.priceLabel}</p>{e.unit&&<p className="mt-1 text-xs text-muted-foreground">{e.unit}</p>}</div>}
   <Button className="mt-auto pt-2" disabled={catalog.pending} onClick={()=>catalog.chooseExperience(e.id)}>Ver detalhes e solicitar informações</Button></div>
  </article>)}</div>
  <ListStatus list={catalog.list} empty="Nenhuma experiência publicada no momento." more="Carregar mais experiências"/>
 </section>;
}
