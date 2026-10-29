import SectionHeading from "./section-heading";
import BenefitCard from "./benefit-card";
import { CATEGORIES } from "./data";

export default function BenefitsCatalog({ category, setCategory, benefits }) {
  return (
    <section id="beneficios" className="ca-wrap ca-section" style={{paddingTop:0,scrollMarginTop:100}}>
      <SectionHeading eyebrow="Escolha a sua vantagem" title="Quem chega junto." description="Conheça as marcas, escolha sua vantagem e confira todos os benefícios. Está tudo aqui, sem letras escondidas." />
      <div className="ca-toolbar"><div className="ca-filters" role="group" aria-label="Filtrar benefícios por categoria">{CATEGORIES.map((item) => <button type="button" key={item} className="ca-filter" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><small role="status">{benefits.length} {benefits.length === 1 ? 'parceria de exemplo' : 'parcerias de exemplo'}</small></div>
      <div className="ca-offers" data-filtered={category !== 'Todos'}>{benefits.map((benefit) => <BenefitCard key={benefit.id} benefit={benefit} />)}</div>
    </section>
  );
}
