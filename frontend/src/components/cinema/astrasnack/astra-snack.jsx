"use client";

import ListStatus from "@/components/cinema/home/list-status";
import { ShoppingBag } from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import CinemaStyles from "./cinema-styles";
import ProductDrawer from "./product-drawer";
import SnackHeader from "./snack-header";
import ProductFilters from "./product-filters";
import ProductCatalog from "./product-catalog";
import { useAstraSnack } from "@/hooks/cinema/astrasnack/use-astra-snack";

export default function AstraSnackPage() {
  const snack = useAstraSnack();
  const {cartOpen,setCartOpen,cartCount}=snack;

  return (
    <main className="astra-grain min-h-screen bg-background text-foreground selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />

      <SnackHeader cartCount={cartCount} loggedIn={Boolean(snack.session.user)} />

      <section className="mx-auto max-w-[1600px] bg-background px-5 py-6 md:px-8">
        <label className="mb-4 block text-sm font-semibold">Cinema<select aria-label="Cinema" value={snack.localId} onChange={e=>snack.changeLocation(e.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-card p-3"><option value="">Selecione o cinema</option>{snack.locations.items.map(l=><option key={l.id_local} value={l.id_local}>{l.nome} — {l.cidade}</option>)}</select></label>
        <ListStatus list={snack.locations} empty="Nenhum cinema disponível." more="Carregar mais cinemas"/>
        {snack.notice&&<p role="status" className="mb-4 text-sm text-primary">{snack.notice}</p>}
        {snack.localId&&<ProductFilters snack={snack} />}

        <ProductCatalog snack={snack} />
      </section>

      {snack.session.user && <button
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

      {snack.session.user&&<CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}

      <ProductDrawer snack={snack} />
    </main>
  )
}
