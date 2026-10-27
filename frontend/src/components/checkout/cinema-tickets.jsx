"use client";

import TicketSelection from "./TicketSelection";
import useTicketCheckout from "@/hooks/cinema/sessao/use-ticket-checkout";

export default function CinemaTickets() {
  const { session, handleContinue, goBack } = useTicketCheckout();
  return <TicketSelection key={`${session.id}:${session.seats.join(",")}`} session={session} onBack={goBack} onContinue={handleContinue} />;
}
