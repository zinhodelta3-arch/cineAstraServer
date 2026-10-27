import Link from "next/link";
import Icon from "./icon";

export default function PartnershipsHero() {
  return (
    <section className="ca-hero ca-hero-cinema">
      <img className="ca-hero-photo" src="/parcerias/sala-cinema.jpg" alt="" aria-hidden="true" width="1800" height="1200" fetchPriority="high" />
      <div className="ca-hero-shade" aria-hidden="true" />
      <div className="ca-wrap ca-hero-stage">
        <nav aria-label="Navegação estrutural" className="ca-breadcrumb"><Link href="/">Cinema</Link><span aria-hidden="true">/</span><span aria-current="page">Parcerias e benefícios</span></nav>
        <div className="ca-opening-credit"><span>CineAstra apresenta</span><span>Além da tela / Vol. 01</span></div>
        <div className="ca-hero-copy-block">
          <p className="ca-eyebrow"><span className="ca-credit-line" aria-hidden="true" />O cinema fica ainda melhor quando a gente soma.</p>
          <h1 className="ca-display">Parcerias<br /><span className="ca-title-second"><span className="ca-amp">&</span> <em>benefícios.</em></span></h1>
          <p className="ca-hero-copy">O filme você escolhe. As vantagens ficam por nossa conta. Descubra quem chega junto para deixar o ingresso, a pipoca e a sua próxima sessão ainda melhores.</p>
          <div className="ca-actions"><a className="ca-btn" href="#beneficios">Encontrar minha vantagem <Icon name="arrow" /></a><a className="ca-hero-text-link" href="#como-funciona">Como funciona <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="ca-hero-footer"><span>INGRESSO. PIPOCA. BOA COMPANHIA.</span><p>O melhor da sessão<br /><strong>começa antes do filme.</strong></p><span className="ca-hero-signature" aria-hidden="true">CineAstra ✦</span></div>
      </div>
      <div className="ca-perf" aria-hidden="true" />
    </section>
  );
}
