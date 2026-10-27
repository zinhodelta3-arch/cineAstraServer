"use client";

import { Trash2, X } from "lucide-react";
import { formatBRL } from "./data";
import { SmartImg, Button } from "./home-ui";
import { useHomeCart } from "@/hooks/cinema/home/use-home-cart";

export default function CartDrawer({ items, onRemove, onClose }) {
  const { total } = useHomeCart(items, onClose);

  return (
    <div role="dialog" aria-modal="true" aria-label="Seu pedido" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-l border-border h-full p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="f-display text-3xl font-black text-foreground">Seu Pedido</h3>
            <button type="button" onClick={onClose} aria-label="Fechar carrinho" className="text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">Seu pedido está vazio.</p>}
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center justify-between gap-3 p-3 bg-muted/20 border border-border rounded-lg">
                {item.image && (
                  <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md">
                    <SmartImg src={item.image} alt={item.title} title={item.title} icon={item.icon} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <span className="text-xs font-bold text-primary mt-1 block">{item.priceFormatted}</span>
                </div>
                <button type="button" onClick={() => onRemove(idx)} aria-label={`Remover ${item.title}`} className="text-destructive hover:opacity-80 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground text-sm">Total:</span>
            <span className="f-display text-3xl font-black text-primary">{formatBRL(total)}</span>
          </div>
          <Button className="w-full" size="lg" disabled={items.length === 0}>Finalizar Compra</Button>
        </div>
      </div>
    </div>
  );
}
