"use client"

import useCinemaPlans from "@/hooks/cinema/planos/use-cinema-plans"
import PlansHero from "./plans-hero"
import PlansCatalog from "./plans-catalog"
import PlansSharing from "./plans-sharing"
import PlansBenefits from "./plans-benefits"
import PlansFaq from "./plans-faq"
import PlansSubscription from "./plans-subscription"

export default function CinemaPlans() {
  const { hero, catalog, sharing, faq, subscription } = useCinemaPlans()

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <PlansHero {...hero} />
      <PlansCatalog {...catalog} />
      <PlansSharing {...sharing} />
      <PlansBenefits />
      <PlansFaq {...faq} />
      <PlansSubscription {...subscription} />
    </main>
  )
}
