import Icon from "./icon";
import Coupon from "./coupon";

export default function BenefitCard({ benefit }) {
  return <article id={`parceria-${benefit.id}`} className={`ca-offer-card ca-partner-${benefit.id} bg-card border-border`} aria-labelledby={`title-${benefit.id}`}>
    <div className="ca-partner-photo">
      <img src={benefit.image} alt={benefit.imageAlt} width="1100" height="733" loading="lazy" />
      <div className="ca-photo-shade" />
      <div className="ca-photo-meta"><span>{benefit.reference}</span><span>{benefit.category}</span></div>
      <div className="ca-photo-caption"><span className="ca-brand-name" data-brand={benefit.id}>{benefit.brand}</span><p>{benefit.title}</p></div>
      <div className="ca-photo-perf" aria-hidden="true" />
    </div>
    <div className="ca-partner-content">
      <div className="ca-card-main">
        <span className="ca-category">Vantagens dessa parceria</span>
        <h3 id={`title-${benefit.id}`} className="ca-display">{benefit.highlight}</h3>
        <p className="ca-partner-intro">{benefit.description}</p>
        <ul className="ca-perks">{benefit.perks.map((perk) => <li key={perk.label}><strong className="ca-perk-value ca-display">{perk.value}</strong><div><h4>{perk.label}</h4><p>{perk.note}</p></div></li>)}</ul>
        <div className="ca-card-condition"><Icon name="check" /><span>{benefit.eligibility}</span></div>
        <div className="ca-visible-rules"><h4>Vale saber antes da sessão</h4><ul>{benefit.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul></div>
      </div>
      <div className="ca-ticket-tear" aria-hidden="true" />
      <Coupon benefit={benefit} />
    </div>
  </article>;
}
