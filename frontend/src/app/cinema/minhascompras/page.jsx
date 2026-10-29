import PurchaseHistory from "@/components/purchases/PurchaseHistory";

export const metadata = {
  title: "Minhas compras | CineAstra",
  description: "Seu histórico de pedidos e ingressos no CineAstra.",
};

export default function MyPurchasesPage() {
  return <PurchaseHistory />;
}
