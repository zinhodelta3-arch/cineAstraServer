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
import useCinemaCart from "@/hooks/cinema/carrinho/use-cinema-cart";
import SnackCampaigns from "./snack-campaigns";

export default function AstraSnackPage() {
  const snack = useAstraSnack();
  const {cartOpen,setCartOpen,cartCount}=snack;
  const cartPreview = useCinemaCart({enabled: cartOpen});
  const canOpenCart = snack.guest || snack.session.user?.role === "CLIENTE";

  return (
    <main className="astra-grain min-h-screen bg-background text-foreground selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />

      <SnackHeader cartCount={cartCount} showCart={canOpenCart} />
      <nav aria-label="Seções do AstraSnack" className="mx-auto flex max-w-[1600px] gap-6 px-5 pt-4 text-sm font-semibold md:px-8">
        <a href="#cardapio" className="py-2 text-primary underline-offset-4 hover:underline">Cardápio</a>
        <a href="#campanhas" className="py-2 text-primary underline-offset-4 hover:underline">Campanhas</a>
      </nav>

      <section id="cardapio" className="mx-auto max-w-[1600px] scroll-mt-24 bg-background px-5 py-6 md:px-8">
        <div className="mb-4 grid gap-y-2 rounded-lg border border-border bg-card px-4 py-3 sm:grid-cols-[minmax(0,24rem)_1fr] sm:items-center sm:gap-x-6">
          <label htmlFor="snack-cinema" className="text-sm font-semibold">
            Cinema para retirada
          </label>
            <select id="snack-cinema" aria-describedby="snack-pickup" value={snack.localId} onChange={event => snack.changeLocation(event.target.value)} className="block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-semibold sm:col-start-1 sm:row-start-2">
              {!snack.localId && <option value="">Selecione um cinema</option>}
              {snack.locations.items.map(local => <option key={local.id_local} value={local.id_local}>{local.nome} — {local.cidade}</option>)}
            </select>
          <p id="snack-pickup" className="flex items-start gap-2 text-sm text-muted-foreground sm:col-start-2 sm:row-start-2">
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
      <SnackCampaigns ticketPromotionBps={snack.ticketPromotionBps} />

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

      {canOpenCart && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} preview={cartPreview} />}

      <ProductDrawer snack={snack} />
    </main>
  )
}
