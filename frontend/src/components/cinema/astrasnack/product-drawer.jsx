"use client";

import { Minus, Plus, Popcorn, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function ProductDrawer({ product, open, onOpenChange, quantity, total, onDecrease, onIncrease, onAdd }) {
  if (!product) return null


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/70 p-5 pr-14">
            <div className="text-[10px] font-bold tracking-[.24em] text-primary uppercase">
              AstraSnack
            </div>
            <SheetTitle className="text-2xl font-black">{product.name}</SheetTitle>
            <SheetDescription>{product.category}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="aspect-square bg-muted">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Popcorn className="size-20 text-muted-foreground/25" />
                </div>
              )}
            </div>

            <div className="space-y-5 p-5">
              <p className="text-sm leading-6 text-muted-foreground">{product.description}</p>

              <div className="astra-ticket border-y border-dashed border-border/80 py-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-[.2em] text-muted-foreground uppercase">
                      Valor unitário
                    </div>
                    <div className="mt-1 text-2xl font-black">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1">
                    <Button variant="ghost" size="icon-sm" onClick={onDecrease}>
                      <Minus />
                    </Button>
                    <span className="w-7 text-center text-sm font-bold">{quantity}</span>
                    <Button variant="ghost" size="icon-sm" onClick={onIncrease}>
                      <Plus />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 bg-card p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
            </div>
            <Button className="w-full" size="lg" onClick={() => onAdd(product, quantity)}>
              <ShoppingBag className="size-4" />
              Adicionar ao carrinho
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
