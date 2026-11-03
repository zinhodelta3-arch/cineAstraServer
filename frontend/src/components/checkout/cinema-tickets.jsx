"use client";

import TicketSelection from "./TicketSelection";
import useTicketCheckout from "@/hooks/cinema/sessao/use-ticket-checkout";
import Link from "next/link";

export default function CinemaTickets() {
  const { session, handleContinue, goBack } = useTicketCheckout();
  if (!session) return <main className="mx-auto max-w-xl p-8" role="alert">Escolha uma sessão e seus assentos antes dos ingressos. <Link className="text-primary underline" href="/cinema/filmes">Ver filmes</Link></main>;
  return <TicketSelection key={`${session.id}:${session.seats.join(",")}`} session={session} onBack={goBack} onContinue={handleContinue} />;
}
