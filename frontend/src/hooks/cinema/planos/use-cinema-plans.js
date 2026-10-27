"use client"

import { useState } from "react"
import { PLANS } from "@/components/cinema/planos/data"

const money = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function useCinemaPlans() {
  const [billing, setBilling] = useState("monthly")
  const [selected, setSelected] = useState("plus")
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePlan, setSharePlan] = useState("plus")
  const [paymentSplit, setPaymentSplit] = useState("titular")
  const [inviteContact, setInviteContact] = useState("")
  const [inviteSent, setInviteSent] = useState(false)
  const [faqOpen, setFaqOpen] = useState(0)
  const [checkoutNotice, setCheckoutNotice] = useState(false)

  const periodFor = billing === "monthly" ? "/mês" : "/ano"

  const startSubscription = (id) => {
    setSelected(id)
    setCheckoutNotice(true)
    document.getElementById("assinar")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const submitInvite = (event) => {
    event.preventDefault()
    setInviteSent(true)
  }

  const plans = PLANS.map((plan) => ({
    ...plan,
    priceLabel: money(billing === "monthly" ? plan.monthly : plan.annual),
    savingsLabel: money(Math.round((plan.monthly * 12 - plan.annual) * 100) / 100),
  }))
  const selectedPlanName = PLANS.find((plan) => plan.id === selected)?.name
  const showPlans = () => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })
  const showSharing = () => document.getElementById("compartilhar")?.scrollIntoView({ behavior: "smooth" })
  const toggleSharing = () => setShareOpen((value) => !value)
  const resetInvite = () => { setInviteSent(false); setInviteContact("") }
  const changeSharePlan = (event) => setSharePlan(event.target.value)
  const changeInviteContact = (event) => setInviteContact(event.target.value)
  const toggleFaq = (index) => setFaqOpen((current) => current === index ? -1 : index)
  const compareAgain = () => { setCheckoutNotice(false); showPlans() }

  return {
    hero: { showPlans, showSharing },
    catalog: { plans, billing, setBilling, periodFor, startSubscription },
    sharing: { shareOpen, toggleSharing, inviteSent, resetInvite, submitInvite, sharePlan, changeSharePlan, inviteContact, changeInviteContact, paymentSplit, setPaymentSplit },
    faq: { faqOpen, toggleFaq },
    subscription: { checkoutNotice, selectedPlanName, compareAgain },
  }
}
