"use client"

import useCinemaPlans from "@/hooks/cinema/planos/use-cinema-plans"
import PlansHero from "./plans-hero"
import PlansCatalog from "./plans-catalog"
import PlansSubscription from "./plans-subscription"

export default function CinemaPlans() {
  const { hero, catalog, subscription } = useCinemaPlans()

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <PlansHero {...hero} />
      <PlansCatalog {...catalog} />
      <PlansSubscription {...subscription} />
    </main>
  )
}
