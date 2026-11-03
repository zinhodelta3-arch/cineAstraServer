"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useCheckoutSession, CHECKOUT_SESSION_KEY } from "@/hooks/use-checkout-session";

const ORDER_KEY = "cineastra:checkout:order";

export default function useTicketCheckout() {
  const router = useRouter();
  const session = useCheckoutSession(null);
  const { items, addItem, removeItem } = useCart();

  function handleContinue(order) {
    if (!order.session.seatMap || !order.session.localId) throw new Error("Seleção de assentos inválida. Volte ao filme e escolha a sessão novamente.");
    const selectedSeats = order.session.seats.map(seat => ({ label: seat, seatId: order.session.seatMap.find(item => item.id === seat)?.seatId }));
    if (selectedSeats.some(seat => !seat.seatId)) throw new Error("Assento indisponível. Volte e escolha os lugares novamente.");
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(order.session));
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch {
      throw new Error("Não foi possível guardar sua seleção neste navegador. Tente novamente.");
    }
    for (const item of items.filter(item => item.purchaseKind === "SESSION" && item.sourceId === order.session.id)) removeItem(item.id, item.type, item.details);
    for (const { label: seat, seatId } of selectedSeats) {
      addItem({
        id: `ticket-${order.session.id}-${seatId}`,
        type: "ticket",
        name: "Ingresso inteira",
        category: "Ingresso de cinema",
        description: `${order.session.movie.title} • ${order.session.cinema.name}`,
        details: `${order.session.dateLabel} às ${order.session.time} • Assento: ${seat}`,
        price: order.tickets[0].unitPriceCents / 100,
        image: order.session.movie.poster || "",
        purchaseKind: "SESSION", sourceId: order.session.id,
        seatId, localId: order.session.localId,
      });
    }
    router.push("/cinema/carrinho");
  }

  const goBack = () => router.push(session ? `/cinema/sessao/assentos?sessionId=${session.id}` : "/cinema/filmes");
  return { session, handleContinue, goBack };
}
