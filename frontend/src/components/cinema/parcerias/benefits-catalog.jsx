import SectionHeading from './section-heading';
import BenefitCard from './benefit-card';
import ListStatus from '@/components/cinema/home/list-status';

export default function BenefitsCatalog({list,category,setCategory,categories,benefits}){
 return <section id="beneficios" className="ca-wrap ca-section" style={{scrollMarginTop:100}}>
  <SectionHeading eyebrow="Conheça as parcerias" title="Quem chega junto." description="Explore as parcerias publicadas e confira suas condições." />
  <div className="ca-toolbar">
   <div className="ca-filters" role="group" aria-label="Filtrar parcerias por categoria">
    <button type="button" className="ca-filter" aria-pressed={category===null} onClick={()=>setCategory(null)}>Todos</button>
    {categories.map(item=><button type="button" key={item} className="ca-filter" aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}
   </div>
   <small role="status">{benefits.length} parceria(s) exibida(s) · filtro sobre os itens carregados</small>
  </div>
  <div className="ca-offers" data-filtered={category!==null}>{benefits.map(benefit=><BenefitCard key={benefit.id} benefit={benefit} />)}</div>
  {!list.loading&&!list.error&&list.items.length>0&&benefits.length===0&&<p>Nenhuma parceria nesta categoria entre os itens carregados.</p>}
  <ListStatus list={list} empty="Nenhuma parceria publicada no momento." more="Carregar mais parcerias" />
 </section>;
}
