"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useCheckoutSession } from "@/hooks/use-checkout-session";
import { useSession } from "@/hooks/auth/use-session";
import { checkoutStorageKey } from "@/lib/api/checkout-storage.mjs";

export default function useTicketCheckout() {
  const router = useRouter();
  const session = useCheckoutSession(null);
  const { user, loading } = useSession();
  const { items, addItem, removeItem } = useCart();

  function handleContinue(order) {
    if (loading || user?.role !== "CLIENTE") throw new Error("Entre na sua conta para continuar.");
    if (!order.session.seatMap || !order.session.localId) throw new Error("Seleção de assentos inválida. Volte ao filme e escolha a sessão novamente.");
    const selectedSeats = order.session.seats.map(seat => ({ label: seat, seatId: order.session.seatMap.find(item => item.id === seat)?.seatId }));
    if (selectedSeats.some(seat => !seat.seatId)) throw new Error("Assento indisponível. Volte e escolha os lugares novamente.");
    try {
      sessionStorage.setItem(checkoutStorageKey("session", user.id), JSON.stringify(order.session));
    } catch {
      throw new Error("Não foi possível guardar sua seleção neste navegador. Tente novamente.");
    }
    for (const item of items.filter(item => item.purchaseKind === "SESSION" && item.sourceId === order.session.id)) removeItem(item.id, item.type, item.details);
    const ticketsBySeat = order.tickets.flatMap(ticket => Array.from({ length: ticket.quantity }, () => ticket));
    for (const [index, { label: seat, seatId }] of selectedSeats.entries()) {
      const ticket = ticketsBySeat[index];
      const halfDeclaration = { meia: "MEIA", nubank: "NUBANK_SIMULADA" }[ticket.id];
      addItem({
        id: `ticket-${order.session.id}-${seatId}`,
        type: "ticket",
        name: ticket.name,
        halfDeclaration,
        category: "Ingresso de cinema",
        description: `${order.session.movie.title} • ${order.session.cinema.name}`,
        details: `${order.session.dateLabel} às ${order.session.time} • Assento: ${seat}`,
        price: ticket.unitPriceCents / 100,
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
