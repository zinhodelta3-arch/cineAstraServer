"use client"

import useCinemaExperiences from "@/hooks/cinema/experiencias/use-cinema-experiences"
import ExperienceHero from "./experience-hero"
import ExperienceCatalog from "./experience-catalog"
import ExperienceBenefits from "./experience-benefits"
import ExperienceInquiry from "./experience-inquiry"
import ExperienceSupport from "./experience-support"

export default function CinemaExperiences() {
  const { chooseExperience, showExperiences, ...inquiry } = useCinemaExperiences()

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <ExperienceHero showExperiences={showExperiences} />
      <ExperienceCatalog chooseExperience={chooseExperience} experiences={inquiry.experiences} list={inquiry.list} />
      <ExperienceBenefits />
      <ExperienceInquiry {...inquiry} />
      <ExperienceSupport />
    </main>
  )
}
