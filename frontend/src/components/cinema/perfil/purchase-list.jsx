import { Check, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PURCHASES } from "./data";
import { money } from "./profile-utils";
import Modal from "./modal";

export default function PurchaseList({ onSelect, selectedPurchase, closePurchase }) {
  return <div className="space-y-1">{PURCHASES.map((purchase) => <div key={purchase.id} className="border-b border-border py-4 last:border-b-0">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-xs font-bold">{purchase.title}</h3><p className="mt-1.5 text-[10px] text-muted-foreground">{purchase.date} · {purchase.id}</p></div><span className="shrink-0 text-xs font-semibold">{money(purchase.total)}</span></div>
    <Modal open={onSelect ? selectedPurchase === purchase.id : undefined} onOpenChange={onSelect ? (isOpen) => isOpen ? onSelect(purchase.id) : closePurchase() : undefined} trigger={<Button variant="link" className="mt-2 h-auto p-0 text-[10px]">Ver compra<ChevronRight className="size-3" /></Button>} title="Detalhes da compra" description={`Pedido ${purchase.id} · ${purchase.date}`}>
      <div className="space-y-4 rounded-xl border border-border bg-background p-5"><h3 className="text-lg font-bold">{purchase.title}</h3><p className="text-sm text-muted-foreground">{purchase.items}</p><p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4" />{purchase.venue}</p><div className="flex items-center justify-between border-t border-dashed border-border pt-4"><span className="text-sm">Total pago</span><strong className="text-lg text-primary">{money(purchase.total)}</strong></div><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary"><Check className="size-3" />{purchase.status}</span></div><p className="text-xs text-muted-foreground">Compra fictícia para demonstração do histórico.</p>
    </Modal>
  </div>)}</div>;
}
