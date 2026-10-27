import { ArrowRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PURCHASES } from "./data";
import SectionHeading from "./section-heading";
import Modal from "./modal";
import PurchaseList from "./purchase-list";

export default function ProfileHistory({ selectedPurchase, setSelectedPurchase, closePurchase, historyOpen, setHistoryOpen }) {
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><SectionHeading icon={History} title="Histórico" /><PurchaseList selectedPurchase={selectedPurchase} onSelect={setSelectedPurchase} closePurchase={closePurchase} /><Modal open={historyOpen} onOpenChange={setHistoryOpen} trigger={<Button variant="link" className="mt-3 h-auto p-0 text-[11px]">Todas as compras<ArrowRight className="size-3" /></Button>} title="Histórico de compras" description="Veja os pedidos e as sessões que fazem parte da sua história no cinema." wide><PurchaseList /><p className="text-xs text-muted-foreground">{PURCHASES.length} compras demonstrativas.</p></Modal></section>;
}
