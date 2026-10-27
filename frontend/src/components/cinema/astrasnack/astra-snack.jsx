"use client";

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
  const { selectedProduct, drawerOpen, setDrawerOpen, quantity, cartOpen, setCartOpen,
    cartCount, handleAddToCart, productTotal, decreaseQuantity, increaseQuantity } = snack;

  return (
    <main className="astra-grain min-h-screen bg-background text-foreground selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />

      <SnackHeader cartCount={cartCount} />

      <section className="mx-auto max-w-[1600px] bg-background px-5 py-6 md:px-8">
        <ProductFilters snack={snack} />

        <ProductCatalog snack={snack} />
      </section>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed right-5 bottom-5 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-xl transition-transform hover:-translate-y-1"
      >
        <ShoppingBag className="size-4" />
        Carrinho
        {cartCount > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-background text-xs text-foreground">
            {cartCount}
          </span>
        )}
      </button>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      <ProductDrawer
        product={selectedProduct}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        quantity={quantity}
        total={productTotal}
        onDecrease={decreaseQuantity}
        onIncrease={increaseQuantity}
        onAdd={handleAddToCart}
      />
    </main>
  )
}
