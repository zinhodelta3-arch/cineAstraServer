"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useCheckoutSession, CHECKOUT_SESSION_KEY } from "@/hooks/use-checkout-session";

const ORDER_KEY = "cineastra:checkout:order";

export default function useTicketCheckout() {
  const router = useRouter();
  const session = useCheckoutSession();
  const { addItem } = useCart();

  function handleContinue(order) {
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(order.session));
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch {
      throw new Error("Não foi possível guardar sua seleção neste navegador. Tente novamente.");
    }
    for (const ticket of order.tickets) {
      addItem({
        id: `ticket-${order.session.id}-${ticket.id}`,
        type: "ticket",
        name: ticket.name,
        category: "Ingresso de cinema",
        description: `${order.session.movie.title} • ${order.session.cinema.name}`,
        details: `${order.session.dateLabel} às ${order.session.time} • Assentos: ${order.session.seats.join(", ")}`,
        price: ticket.unitPriceCents / 100,
        image: order.session.movie.poster || "",
      }, ticket.quantity);
    }
    router.push("/cinema/carrinho");
  }

  const goBack = () => router.push("/cinema/sessao/assentos");
  return { session, handleContinue, goBack };
}
