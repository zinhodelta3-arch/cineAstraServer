"use client";

import { ShoppingBag, Ticket } from "lucide-react";
import styles from "../ticket.module.css";


export default function SnackHeader({ cartCount, loggedIn }) {
  return (
      <section className="border-b border-border/70 bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
          <div className={`${styles.ticket} overflow-hidden`}>
            <div className="px-5 py-6 sm:px-8 md:py-9">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.3em] text-primary uppercase">
                <Ticket className="size-3.5" aria-hidden="true" />
                Bomboniere CineAstra
              </div>
              <h1 className={`${styles.title} text-[clamp(2.5rem,8vw,5rem)] leading-none font-black tracking-tight`}>
                ASTRASNACK<span className="text-primary">.</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                O sabor também faz parte da sessão. Escolha seu snack, encontre seu combo e leve a experiência CineAstra para a poltrona.
              </p>
            </div>
            {loggedIn && <>
              <div className={styles.tear} aria-hidden="true" />
              <div className={`${styles.stub} flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm font-semibold sm:px-8`}>
                <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
                <span>Meu carrinho</span>
                <span className="text-primary">{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
              </div>
            </>}
          </div>
        </div>
      </section>
  );
}
