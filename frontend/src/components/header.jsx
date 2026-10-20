"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { AppearanceSelector } from "@/components/appearance-selector"
import { DesktopNavigation, MobileNavigation } from "@/components/header-nav"
import { NotificationButton } from "@/components/notifications/notification-button"

const LOGO_CONFIG = [
  { keywords: ["catp", "catppuccin", "latte", "frappe", "macchiato"], src: "/Catp.png" },
  { keywords: ["mocha"], src: "/Mocha.png" },
  { keywords: ["violet"], src: "/Violet.png" },
  { keywords: ["doomsday"], src: "/DOOMastra.png" },
]

const DEFAULT_LOGO = "/CineAstras.png"

function getLogoByTheme(theme) {
  if (!theme) return DEFAULT_LOGO
  const normalizedTheme = theme.toLowerCase()
  const config = LOGO_CONFIG.find(({ keywords }) =>
    keywords.some((keyword) => normalizedTheme.includes(keyword))
  )
  return config?.src ?? DEFAULT_LOGO
}

function Perforation({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-6 z-0 h-px bg-[repeating-linear-gradient(90deg,var(--border)_0_5px,transparent_5px_11px)] opacity-60 ${className}`}
    />
  )
}

function Notch({ side }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 z-20 size-4 -translate-y-1/2 rounded-full border border-border/70 bg-background ${
        side === "left"
          ? "-left-2 [clip-path:inset(0_0_0_50%)]"
          : "-right-2 [clip-path:inset(0_50%_0_0)]"
      }`}
    />
  )
}

function TicketSeparator({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-3 left-0 w-px border-l border-dashed border-border/70 ${className}`}
    />
  )
}

export function Header() {
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO)
  const [cartOpen, setCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { itemCount } = useCart()
  const visibleItemCount = mounted ? itemCount : 0

  useEffect(() => {
    setMounted(true)
    const updateLogo = () => {
      setLogoSrc(getLogoByTheme(document.documentElement.getAttribute("data-theme")))
    }

    updateLogo()
    const observer = new MutationObserver(updateLogo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95">
        <div className="mx-auto w-full max-w-[96rem] px-3 py-2 sm:px-5 lg:px-6">
          <div className="relative flex h-16 w-full items-center rounded-lg border border-border/70 bg-card">
            <Notch side="left" />
            <Notch side="right" />
            <Perforation className="top-1" />
            <Perforation className="bottom-1" />

            <Link
              href="/cinema/home"
              aria-label="CineAstra — Página inicial"
              className="relative z-10 flex h-full shrink-0 items-center rounded-l-lg px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5"
            >
              <img
                src={logoSrc}
                alt="CineAstra"
                className="h-9 w-[84px] object-contain object-left sm:h-10 sm:w-[120px] 2xl:w-[144px]"
              />
            </Link>

            <div className="relative z-10 hidden h-full min-w-0 flex-1 items-center justify-center px-3 xl:flex 2xl:px-4">
              <TicketSeparator />
              <DesktopNavigation />
            </div>

            <div className="relative z-10 ml-auto flex h-full shrink-0 items-center gap-2 pl-2 pr-2 sm:gap-3 sm:pl-4 sm:pr-4">
              <TicketSeparator className="hidden sm:block" />

              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/cadastro"
                  className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Criar conta
                </Link>
              </div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <NotificationButton />
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  aria-label={`Abrir carrinho, ${visibleItemCount} ${visibleItemCount === 1 ? "item" : "itens"}`}
                  className="relative grid size-10 shrink-0 place-items-center rounded-md border border-border/70 text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <ShoppingCart className="size-4" aria-hidden="true" />
                  {visibleItemCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
                      {visibleItemCount > 99 ? "99+" : visibleItemCount}
                    </span>
                  )}
                </button>
                <div className="hidden shrink-0 sm:block">
                  <AppearanceSelector />
                </div>
                <MobileNavigation />
              </div>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  )
}
