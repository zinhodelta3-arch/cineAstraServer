"use client"

import useCinemaExperiences from "@/hooks/cinema/experiencias/use-cinema-experiences"
import Link from "next/link"
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
      {inquiry.session.user?.role === "CLIENTE" && <nav aria-label="Minhas experiências" className="mx-auto max-w-[1600px] px-5 pt-6 md:px-10">
        <Link className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4" href="/cinema/experiencias/solicitacoes">Acompanhar minhas solicitações</Link>
      </nav>}
      <ExperienceCatalog chooseExperience={chooseExperience} experiences={inquiry.experiences} list={inquiry.list} />
      <ExperienceBenefits />
      <ExperienceInquiry {...inquiry} />
      <ExperienceSupport />
    </main>
  )
}
