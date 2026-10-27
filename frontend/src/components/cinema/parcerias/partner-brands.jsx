import SectionHeading from "./section-heading";
import { BENEFITS } from "./data";

export default function PartnerBrands() {
  return (
    <section className="ca-section ca-wrap"><SectionHeading eyebrow="Juntos na mesma história" title="Marcas em cena." description="Uma seleção de marcas para apresentar como as parcerias podem aparecer no CineAstra." /><div className="ca-brands">{BENEFITS.map((benefit) => <div className="ca-brand-item" key={benefit.id}><strong className="ca-brand-name" data-brand={benefit.id}>{benefit.brand}</strong><span>{benefit.id === 'astra' ? 'Experiências da casa' : benefit.category}</span></div>)}</div><p className="ca-disclaimer">Marcas citadas como referência visual. Nenhuma parceria comercial é confirmada por esta demonstração.</p></section>
  );
}
