"use client"

import { useState } from "react"

export default function useCinemaExperiences() {
  const [selectedExperience, setSelectedExperience] = useState("sala-privativa")
  const [sent, setSent] = useState(false)
  const minimumDate = new Date().toISOString().slice(0, 10)

  const chooseExperience = (id) => {
    setSelectedExperience(id)
    setSent(false)
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const showExperiences = () => {
    document.getElementById("experiencias")?.scrollIntoView({ behavior: "smooth" })
  }

  const submitInquiry = (event) => {
    event.preventDefault()
    setSent(true)
  }

  const resetInquiry = () => setSent(false)
  const changeExperience = (event) => setSelectedExperience(event.target.value)

  return { selectedExperience, sent, minimumDate, chooseExperience, showExperiences, submitInquiry, resetInquiry, changeExperience }
}
