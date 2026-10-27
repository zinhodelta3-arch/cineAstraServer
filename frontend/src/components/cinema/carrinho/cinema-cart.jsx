"use client"

import { ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import useCinemaCart from "@/hooks/cinema/carrinho/use-cinema-cart"
import CartItem from "./cart-item"
import EmptyCart from "./empty-cart"
import CartSummary from "./cart-summary"

export default function CinemaCart() {
  const { items, itemCount, total, increase, decrease, remove, goBack, checkout } = useCinemaCart()

  return (
    <main className="min-h-[70vh] flex-1 bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex items-center gap-3 text-[10px] font-bold tracking-[.25em] text-primary uppercase"><ShoppingCart className="size-4" /> CineAstra • Meu pedido</div>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold text-muted-foreground">SEU PEDIDO EM UM SÓ LUGAR</p><h1 className="f-display text-4xl font-black tracking-tight sm:text-5xl">Meu carrinho<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "itens"} adicionados</p></div>
          <Button variant="outline" onClick={goBack}><ArrowLeft className="size-4" /> Voltar</Button>
        </div>

        {items.length === 0 ? (
<EmptyCart />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-3">
              {items.map((item) => (
<CartItem key={item.type + item.id + item.details} item={item} decrease={decrease} increase={increase} remove={remove} />
              ))}
              <div className="pt-3"><Button variant="outline" onClick={goBack}><ArrowLeft className="size-4" /> Voltar</Button></div>
            </section>

<CartSummary itemCount={itemCount} total={total} checkout={checkout} />
          </div>
        )}
      </div>
    </main>
  )
}
