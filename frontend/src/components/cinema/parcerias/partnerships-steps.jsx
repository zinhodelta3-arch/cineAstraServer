import Icon from "./icon";
import SectionHeading from "./section-heading";
import { STEPS } from "./data";

export default function PartnershipsSteps() {
  return (
    <section id="como-funciona" className="ca-section ca-steps-section" style={{scrollMarginTop:90}}><div className="ca-wrap">
      <SectionHeading eyebrow="Sem roteiro complicado" title="Do benefício à sessão." description="Três cenas para entender como funciona. As regras de cada oferta sempre vêm primeiro." />
      <div className="ca-steps">{STEPS.map((step, index) => <article className="ca-frame" key={step.title}><div className="ca-frame-perf" aria-hidden="true" /><div className="ca-frame-inner"><div className="ca-frame-top"><span className="ca-display" aria-label={`Passo ${index + 1}`}>0{index + 1}</span><Icon name={step.icon} /></div><h3>{step.title}</h3><p>{step.description}</p></div><div className="ca-frame-perf" aria-hidden="true" /></article>)}</div>
    </div></section>
  );
}
