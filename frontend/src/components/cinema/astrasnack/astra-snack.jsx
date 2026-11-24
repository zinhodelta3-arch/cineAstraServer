"use client";

import ListStatus from "@/components/cinema/home/list-status";
import { MapPin, ShoppingBag } from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import CinemaStyles from "./cinema-styles";
import ProductDrawer from "./product-drawer";
import SnackHeader from "./snack-header";
import ProductFilters from "./product-filters";
import ProductCatalog from "./product-catalog";
import { useAstraSnack } from "@/hooks/cinema/astrasnack/use-astra-snack";
import HomeContentSection from "@/components/cinema/home/home-content-section";

export default function AstraSnackPage() {
  const snack = useAstraSnack();
  const {cartOpen,setCartOpen,cartCount}=snack;
  const canOpenCart = snack.guest || snack.session.user?.role === "CLIENTE";

  return (
    <main className="astra-grain min-h-screen bg-background text-foreground selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />

      <SnackHeader cartCount={cartCount} showCart={canOpenCart} />
      <HomeContentSection kind="banners" placement="astrasnack" />

      <section id="cardapio" className="mx-auto max-w-[1600px] scroll-mt-24 bg-background px-5 py-6 md:px-8">
        <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:grid-cols-[minmax(0,24rem)_1fr] sm:items-center sm:gap-6">
          <label className="text-sm font-semibold">
            Cinema para retirada
            <select aria-describedby="snack-pickup" value={snack.localId} onChange={event => snack.changeLocation(event.target.value)} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3">
              {!snack.localId && <option value="">Selecione um cinema</option>}
              {snack.locations.items.map(local => <option key={local.id_local} value={local.id_local}>{local.nome} — {local.cidade}</option>)}
            </select>
          </label>
          <p id="snack-pickup" className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{snack.location ? <>Retire seu pedido no <strong className="text-foreground">{snack.location.nome}</strong>. Preços e estoque são desta unidade.</> : "A retirada é feita no cinema escolhido."}</span>
          </p>
        </div>
        <ListStatus list={snack.locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas"/>
        {snack.notice&&<p role="status" className="mb-4 text-sm text-primary">{snack.notice}</p>}
        {snack.pickupConflict&&<p className="mb-4 text-sm text-muted-foreground">O carrinho tem itens de outro cinema. Escolha o cinema do carrinho para adicionar lanches ao mesmo pedido.</p>}
        {snack.localId&&<ProductFilters snack={snack} />}

        <ProductCatalog snack={snack} />
      </section>

      {canOpenCart && <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed right-5 bottom-20 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-xl transition-transform hover:-translate-y-1"
      >
        <ShoppingBag className="size-4" />
        Carrinho
        {cartCount > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-background text-xs text-foreground">
            {cartCount}
          </span>
        )}
      </button>}

      {canOpenCart && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}

      <ProductDrawer snack={snack} />
    </main>
  )
}
