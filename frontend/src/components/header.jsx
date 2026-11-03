"use client"

import { useSession } from "@/hooks/auth/use-session"
import useStreamingAccess from "@/hooks/cinema/use-streaming-access"
import SessionControls from "@/components/auth/session-controls"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShoppingCart, TvMinimalPlay } from "lucide-react"
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
  const session = useSession()
  const canAccessStreaming = useStreamingAccess(session.user)
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
              className="relative z-10 flex h-full shrink-0 items-center gap-2 rounded-l-lg px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-2.5 sm:px-5"
            >
              <img
                src={logoSrc}
                alt="CineAstra"
                className="h-9 w-10 shrink-0 object-contain sm:h-10 sm:w-11"
              />
              <span aria-hidden="true" className="whitespace-nowrap text-[20px] font-black leading-none tracking-[-0.06em] sm:text-[24px]">
                <span className="text-black dark:text-white">cine</span><span className="text-primary">astra.</span>
              </span>
            </Link>

            <div className="relative z-10 hidden h-full min-w-0 flex-1 items-center justify-center px-3 xl:flex 2xl:px-4">
              <TicketSeparator />
              <DesktopNavigation />
            </div>

            <div className="relative z-10 ml-auto flex h-full shrink-0 items-center gap-2 pl-2 pr-2 sm:gap-3 sm:pl-4 sm:pr-4">
              <TicketSeparator className="hidden sm:block" />

              {canAccessStreaming && <Link href="/streaming" className="hidden xl:inline-flex shrink-0 items-center gap-2 rounded-md border border-dashed border-primary/60 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><TvMinimalPlay className="size-4" aria-hidden="true" /> Streaming</Link>}

              <div className={session.user ? "flex items-center" : "hidden items-center sm:flex"}><SessionControls session={session} /></div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {session.user && <NotificationButton key={session.user.id} userId={session.user.id} />}
                {session.user && <button
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
                </button>}
                <div className="hidden shrink-0 sm:block">
                  <AppearanceSelector />
                </div>
                <MobileNavigation session={session} canAccessStreaming={canAccessStreaming} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {session.user && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}
    </>
  )
}
