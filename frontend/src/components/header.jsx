"use client"

import { useSession } from "@/hooks/auth/use-session"
import useStreamingAccess from "@/hooks/cinema/use-streaming-access"
import SessionControls from "@/components/auth/session-controls"

import Link from "next/link"
import { useState } from "react"
import { ShoppingCart, TvMinimalPlay } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { AppearanceSelector } from "@/components/appearance-selector"
import { useAppearance } from "@/components/providers/appearance-provider"
import { DesktopNavigation, MobileNavigation, SupportLink } from "@/components/header-nav"
import { NotificationButton } from "@/components/notifications/notification-button"
import { FloatingAssistant } from "@/components/support/floating-assistant"
import LocationSelector from "@/components/cinema/location-selector"
import styles from "./header.module.css"

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

export function Header({ showAssistant = false }) {
  const session = useSession()
  const canAccessStreaming = useStreamingAccess()
  const { appearance } = useAppearance()
  const logoSrc = getLogoByTheme(appearance)
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount: visibleItemCount } = useCart()
  const canOpenCart = !session.loading && (session.user?.role === "CLIENTE" || (!session.user && visibleItemCount > 0))

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95">
        <div className="mx-auto w-full max-w-[96rem] px-3 py-2 sm:px-5 lg:px-6">
          <div data-slot="cinema-header-frame" className={`w-full rounded-xl border border-border bg-card ${styles.frame}`}>
            <div className="flex min-h-14 items-center justify-between gap-2 px-3 sm:min-h-16 sm:gap-4 sm:px-6 lg:px-9">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-3 lg:gap-5">
               <Link
                href="/cinema/home"
                aria-label="CineAstra — Página inicial"
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-2.5"
              >
                <img
                  src={logoSrc}
                  alt="CineAstra"
                  className="h-9 w-10 shrink-0 object-contain sm:h-10 sm:w-11"
                />
                <span aria-hidden="true" className={`hidden whitespace-nowrap text-xl font-black leading-none tracking-tight text-foreground sm:text-2xl ${showAssistant && session.user ? "min-[420px]:inline" : "min-[360px]:inline"}`}>
                  cine<span className="text-primary">astra.</span>
                </span>
               </Link>
               <LocationSelector />
              </div>
              <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
                {canAccessStreaming && <Link href="/streaming" className="hidden min-h-10 shrink-0 items-center gap-2 rounded-md border border-dashed border-primary/60 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:inline-flex"><TvMinimalPlay className="size-4" aria-hidden="true" /> Streaming</Link>}
                {session.user && <NotificationButton key={session.user.id} userId={session.user.id} role={session.user.role} className={styles.action} />}
                {canOpenCart && <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  aria-label={`Abrir carrinho, ${visibleItemCount} ${visibleItemCount === 1 ? "item" : "itens"}`}
                  className={`relative grid size-10 shrink-0 place-items-center rounded-md border text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${styles.action}`}
                >
                  <ShoppingCart className="size-4" aria-hidden="true" />
                  {visibleItemCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
                      {visibleItemCount > 99 ? "99+" : visibleItemCount}
                    </span>
                  )}
                </button>}
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <AppearanceSelector triggerClassName={styles.action} />
                  <SupportLink />
                </div>
                <MobileNavigation session={session} canAccessStreaming={canAccessStreaming} />
                <div className={session.user ? "flex items-center" : "hidden items-center sm:flex"}><SessionControls session={session} /></div>
              </div>
            </div>
            <div className={styles.navigationBand}>
              <DesktopNavigation />
            </div>
          </div>
        </div>
      </header>

      {canOpenCart && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}
      {showAssistant && !session.loading && session.user?.role === "CLIENTE" && (
        <FloatingAssistant key={session.user.id} signedIn />
      )}
    </>
  )
}
