"use client";

import ListStatus from "@/components/cinema/home/list-status";
import Image from "next/image";
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
import styles from "./astra-snack.module.css";

export default function AstraSnackPage() {
  const snack = useAstraSnack();
  const {cartOpen,setCartOpen,cartCount}=snack;
  const cartPreview = useCinemaCart({enabled: cartOpen});
  const canOpenCart = snack.guest || snack.session.user?.role === "CLIENTE";

  return (
    <main className="astra-grain min-h-screen bg-background text-foreground selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />

      <SnackHeader cartCount={cartCount} showCart={canOpenCart} />
      <nav aria-label="Seções do AstraSnack" className="mx-auto flex max-w-[1600px] flex-wrap gap-x-6 px-5 pt-4 text-sm font-semibold md:px-8">
        <a href="#cardapio" className="py-2 text-primary underline-offset-4 hover:underline">Avulsos</a>
        <a href="#combos" className="py-2 text-primary underline-offset-4 hover:underline">Combos</a>
        <a href="#campanhas" className="py-2 text-primary underline-offset-4 hover:underline">Campanhas</a>
      </nav>

      <section id="cardapio" aria-label="Cardápio" className="mx-auto max-w-[1600px] scroll-mt-40 bg-background px-5 py-6 md:px-8">
        <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          A disponibilidade dos insumos varia de acordo com a unidade.
        </p>
        {snack.notice&&<p role="status" className="mb-4 text-sm text-primary">{snack.notice}</p>}
        {snack.pickupConflict&&<p className="mb-4 text-sm text-muted-foreground">O carrinho tem itens de outro cinema. Escolha o cinema do carrinho para adicionar lanches ao mesmo pedido.</p>}
        {snack.localId ? (
          <>
            <ProductFilters query={snack.query} onQueryChange={snack.setQuery} />
            <p className="mt-3 text-sm text-muted-foreground">
              {snack.session.user?.role === "CLIENTE"
                ? "Os preços incluem os descontos disponíveis para sua conta. Cupons são aplicados no carrinho."
                : snack.guest && "Os preços incluem promoções públicas. Entre para consultar os descontos da sua conta."}
            </p>
            <ProductCatalog id="avulsos" title="Itens avulsos" kind="INPUT" more="Carregar mais produtos" snack={snack} />

            <a href="#combos" aria-label="Combos para a sua sessão" className={styles.comboBanner}>
              <picture className="relative block h-full">
                <source media="(width < 40rem)" srcSet="/astrasnack/banner-combos-mobile.webp" />
                <Image src="/astrasnack/banner-combos.webp" alt="" fill unoptimized className="object-contain" />
              </picture>
            </a>

            <ProductCatalog id="combos" title="Combos" kind="COMBO" more="Carregar mais combos" snack={snack} />
          </>
        ) : snack.ready && <ListStatus list={snack.locations} empty="Escolha um cinema no cabeçalho para consultar produtos e combos." showMore={false} />}
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
