import { validOrderId } from '@/lib/api/purchases.mjs';
import PurchaseHistory from "@/components/purchases/PurchaseHistory";

export const metadata = {
  title: "Minhas compras | CineAstra",
  description: "Seu histórico de pedidos e ingressos no CineAstra.",
};

export default async function MyPurchasesPage({searchParams}) {
  const {pedido}=await searchParams;
  return <PurchaseHistory orderId={validOrderId(pedido)?pedido:null} />;
}
