import Icon from "./icon";

export default function FeaturedPartnership({ showAllBenefits }) {
  return (
    <section className="ca-section ca-wrap" aria-label="Benefício em destaque">
      <div className="ca-feature"><div className="ca-feature-copy"><span className="ca-eyebrow"><Icon name="star" />Em destaque / especial de estreia</span><h2 className="ca-display">Um bom filme.<br />Uma ótima companhia.</h2><p>A próxima história fica melhor quando é compartilhada. Conheça a proposta do Astra Duo para a sua próxima sessão a dois.</p><a className="ca-btn" href="#parceria-astra" onClick={showAllBenefits}>Astra Duo, logo abaixo <Icon name="arrow" /></a></div><div className="ca-feature-stub"><div className="ca-display ca-offer-number">20<span>%</span></div><p>de desconto<br /><strong>para a dupla</strong></p><small>OFERTA DEMONSTRATIVA / 003</small></div></div>
      <p className="ca-disclaimer">Conceito de campanha. Os parceiros, percentuais e condições desta página são exemplos para o projeto.</p>
    </section>
  );
}
