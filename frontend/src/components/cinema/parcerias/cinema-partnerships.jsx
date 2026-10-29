"use client";
import useCinemaPartnerships from '@/hooks/cinema/parcerias/use-cinema-partnerships';
import './parcerias.css';
import PartnershipsHero from './partnerships-hero';
import BenefitsCatalog from './benefits-catalog';
import PartnershipsSteps from './partnerships-steps';

export default function CinemaPartnerships(){
 const catalog=useCinemaPartnerships();
 return <main className="ca-benefits min-h-screen bg-background text-foreground">
  <PartnershipsHero />
  <BenefitsCatalog {...catalog} />
  <PartnershipsSteps />
  <div className="ca-end-note"><div className="ca-wrap"><span>CineAstra ✦ Parcerias e benefícios</span><span>Consulte as condições publicadas por cada parceiro.</span></div></div>
 </main>;
}
