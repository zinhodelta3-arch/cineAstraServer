import Icon from './icon';
import SectionHeading from './section-heading';
const steps=[
 {icon:'star',title:'Escolha uma parceria',description:'Veja as informações publicadas e filtre os parceiros por categoria.'},
 {icon:'ticket',title:'Confira as condições',description:'Leia a descrição e, quando disponível, acesse o endereço indicado pelo parceiro.'},
 {icon:'check',title:'Confirme antes de comprar',description:'Uma divulgação não aplica descontos automaticamente. A validade de cupons e os valores finais dependem da cotação no checkout.'}
];
export default function PartnershipsSteps(){
 return <section id="como-funciona" className="ca-section ca-steps-section" style={{scrollMarginTop:90}}><div className="ca-wrap">
  <SectionHeading eyebrow="Antes de aproveitar" title="Conheça cada vantagem." description="As condições publicadas orientam o uso de cada parceria." />
  <div className="ca-steps">{steps.map((step,index)=><article className="ca-frame" key={step.title}><div className="ca-frame-perf" aria-hidden="true" /><div className="ca-frame-inner"><div className="ca-frame-top"><span className="ca-display" aria-label={`Passo ${index+1}`}>0{index+1}</span><Icon name={step.icon} /></div><h3>{step.title}</h3><p>{step.description}</p></div><div className="ca-frame-perf" aria-hidden="true" /></article>)}</div>
 </div></section>;
}
