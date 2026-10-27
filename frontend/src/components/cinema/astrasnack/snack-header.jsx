"use client";

import { ShoppingBag, Ticket } from "lucide-react";
import BannerCarousel from "./banner-carousel";

export default function SnackHeader({ cartCount }) {
  return (
      <section className="border-b border-border/70 bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.3em] text-primary uppercase">
                <Ticket className="size-3.5" />
                CineAstra • AstraSnack
              </div>
              <h1 className="f-display text-5xl font-black tracking-tight md:text-7xl">
                ASTRASNACK<span className="text-primary">.</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                O sabor também faz parte da sessão. Escolha seu snack, monte seu combo e leve a experiência CineAstra para a poltrona.
              </p>
            </div>

            <div className="astra-cart-ticket hidden w-52 shrink-0 sm:flex">
              <div className="astra-cart-ticket-main">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-black tracking-[.2em] uppercase">
                    <Ticket className="size-3" />
                    CineAstra
                  </div>
                  <ShoppingBag className="size-4" />
                </div>
                <div className="mt-2 text-[10px] font-bold tracking-[.18em] uppercase opacity-80">
                  Meu carrinho
                </div>
                <div className="mt-0.5 text-2xl font-black">
                  {String(cartCount).padStart(2, "0")} <span className="text-xs font-bold opacity-75">itens</span>
                </div>
              </div>
              <div className="astra-cart-ticket-stub">
                <span>AstraSnack • Ticket</span>
              </div>
            </div>
          </div>

          <BannerCarousel />
        </div>
      </section>
  );
}
