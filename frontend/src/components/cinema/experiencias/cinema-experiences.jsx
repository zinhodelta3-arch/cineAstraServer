"use client"

import useCinemaExperiences from "@/hooks/cinema/experiencias/use-cinema-experiences"
import ExperienceHero from "./experience-hero"
import ExperienceCatalog from "./experience-catalog"
import ExperienceInquiry from "./experience-inquiry"
import ExperienceSupport from "./experience-support"

export default function CinemaExperiences() {
  const catalog = useCinemaExperiences()

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <ExperienceHero showExperiences={catalog.showExperiences} />
      <ExperienceCatalog catalog={catalog} />
      <ExperienceInquiry catalog={catalog} />
      <ExperienceSupport />
    </main>
  )
}
