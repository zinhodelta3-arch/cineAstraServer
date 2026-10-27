"use client";

import useCinemaPartnerships from "@/hooks/cinema/parcerias/use-cinema-partnerships";
import Icon from "./icon";
import "./parcerias.css";
import PartnershipsHero from "./partnerships-hero";
import FeaturedPartnership from "./featured-partnership";
import BenefitsCatalog from "./benefits-catalog";
import PartnershipsSteps from "./partnerships-steps";
import PartnerBrands from "./partner-brands";
import PartnershipsFaq from "./partnerships-faq";

export default function CinemaPartnerships() {
  const { category, setCategory, benefits, showAllBenefits } = useCinemaPartnerships();

  return <main className="ca-benefits min-h-screen bg-background text-foreground">
    <PartnershipsHero />

    <div className="ca-strip"><div className="ca-wrap"><span><Icon name="ticket" />Vantagens em ingressos</span><span><Icon name="star" />Combos com condições especiais</span><span><Icon name="film" />Mais motivos para voltar</span></div></div>

    <FeaturedPartnership showAllBenefits={showAllBenefits} />

    <BenefitsCatalog category={category} setCategory={setCategory} benefits={benefits} />

    <PartnershipsSteps />

    <PartnerBrands />

    <PartnershipsFaq />
    <div className="ca-end-note"><div className="ca-wrap"><span>CineAstra ✦ Parcerias e benefícios</span><span>Projeto demonstrativo · Condições sujeitas à definição</span></div></div>
  </main>;
}
