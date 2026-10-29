import Icon from './icon';

export default function BenefitCard({benefit}){
 return <article id={`parceria-${benefit.id}`} className="ca-offer-card bg-card border-border" aria-labelledby={`title-${benefit.id}`}>
  {benefit.image&&<div className="ca-partner-photo">
   <img src={benefit.image} alt={benefit.imageAlt||benefit.title} width="1100" height="733" loading="lazy" />
   <div className="ca-photo-shade" />
   {benefit.tag&&<div className="ca-photo-meta"><span>{benefit.tag}</span></div>}
   <div className="ca-photo-perf" aria-hidden="true" />
  </div>}
  <div className="ca-partner-content">
   <div className="ca-card-main">
    <span className="ca-category">{benefit.tag||'Parceria CineAstra'}</span>
    <h3 id={`title-${benefit.id}`} className="ca-display break-words">{benefit.title}</h3>
    <p className="ca-partner-intro break-words">{benefit.summary}</p>
    {benefit.description&&<details className="ca-visible-rules"><summary className="cursor-pointer font-bold">Detalhes e condições</summary><p className="mt-3 whitespace-pre-wrap break-words">{benefit.description}</p></details>}
   </div>
   {benefit.href&&<><div className="ca-ticket-tear" aria-hidden="true" /><div className="ca-redeem"><a className="ca-btn" href={benefit.href} rel={benefit.href.startsWith('https:')?'noopener noreferrer':undefined}>{benefit.ctaLabel||'Conhecer parceria'} <Icon name="arrow" /></a></div></>}
  </div>
 </article>;
}
