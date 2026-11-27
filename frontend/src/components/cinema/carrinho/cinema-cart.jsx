"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import useCinemaCart from "@/hooks/cinema/carrinho/use-cinema-cart"
import { useSession } from "@/hooks/auth/use-session"
import CartItem from "./cart-item"
import EmptyCart from "./empty-cart"
import CartSummary from "./cart-summary"
import CartSnacks from "./cart-snacks"
import styles from "./cart-layout.module.css"

export default function CinemaCart() {
  const { user, loading } = useSession()
  if (loading) return <main className="mx-auto w-full max-w-6xl p-8" role="status">Verificando sua conta…</main>
  return <AccountCart key={user?.id ?? "guest"} />
}

function AccountCart() {
  const { items, itemCount, increase, decrease, remove, goBack, summary, savedForLater, resumeSavedItems } = useCinemaCart()

  return (
    <main className="min-h-[70vh] flex-1 bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className={"f-display " + styles.title}>Meu carrinho<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">{itemCount === 1 ? "1 item adicionado" : `${itemCount} itens adicionados`}</p></div>
          <Button variant="outline" onClick={goBack}><ArrowLeft className="size-4" /> Voltar</Button>
        </div>

        {savedForLater.length > 0 && (
          <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card p-4" aria-label="Itens para outro pedido">
            <div>
              <h2 className="font-semibold">Itens guardados para outro pedido</h2>
              <p className="mt-1 text-sm text-muted-foreground">{items.length ? "Esses itens ficam disponíveis quando seu carrinho estiver vazio." : "Retome os itens de um cinema por vez."}</p>
            </div>
            {!items.length && <Button variant="outline" onClick={resumeSavedItems}>Retomar itens guardados</Button>}
          </section>
        )}
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-label="Itens do carrinho" className="min-w-0 space-y-4">
              {items.map((item) => (
                <CartItem key={item.type + item.id + item.details} item={item} decrease={decrease} increase={increase} remove={remove} />
              ))}
              <CartSnacks session={summary.session} coupon={summary.coupon} enabled={!summary.issue} ticketItems={items} />
            </section>

            <CartSummary items={items} {...summary} />
          </div>
        )}
      </div>
    </main>
  )
}
