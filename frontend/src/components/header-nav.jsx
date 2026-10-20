"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  ArrowUpRight, CircleHelp, Crown, Film, House, MapPin, Menu,
  Popcorn, Sparkles, UserRound, UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { AppearanceSelector } from "@/components/appearance-selector"

const navigation = [
  { label: "Início", href: "/cinema/home", icon: House },
  { label: "Filmes", href: "/cinema/filmes", icon: Film },
  { label: "Cinemas", href: "/cinema/localizacoes", icon: MapPin },
  { label: "AstraSnack", href: "/cinema/astrasnack", icon: Popcorn },
  { label: "Experiências", href: "/cinema/experiencias", icon: Sparkles },
  { label: "Planos", href: "/planos", icon: Crown },
  { label: "Suporte", href: "/cinema/suporte", icon: CircleHelp },
]

function TearLine() {
  return <div aria-hidden="true" className="mx-5 border-t border-dashed border-border/70" />
}

function Barcode() {
  const bars = [2, 1, 3, 1, 2, 3, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2]

  return (
    <div aria-hidden="true" className="flex h-6 items-end gap-[2px] opacity-40">
      {bars.map((width, index) => (
        <span
          key={index}
          className="bg-foreground"
          style={{ width, height: `${65 + ((index * 11) % 35)}%` }}
        />
      ))}
    </div>
  )
}

function NavigationItems({ mobile = false, onNavigate }) {
  const pathname = usePathname()

  return (
    <ul className={mobile ? "flex flex-col gap-1 py-3" : "flex items-center gap-0.5 2xl:gap-1"}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = Boolean(
          href && (pathname === href || pathname?.startsWith(`${href}/`))
        )

        return (
          <li key={label} className="min-w-0">
            {href ? (
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  mobile ? "px-3" : "px-2.5 2xl:px-3"
                } ${
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`${mobile ? "block" : "hidden 2xl:block"} size-4 shrink-0`}
                  aria-hidden="true"
                />
                <span>{label}</span>
                {mobile && (
                  <ArrowUpRight className="ml-auto size-4 opacity-50" aria-hidden="true" />
                )}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={`flex min-h-11 select-none items-center gap-2 whitespace-nowrap rounded-md text-sm text-muted-foreground ${
                  mobile ? "px-3" : "px-2.5 2xl:px-3"
                }`}
              >
                <Icon
                  className={`${mobile ? "block" : "hidden 2xl:block"} size-4 shrink-0 opacity-60`}
                  aria-hidden="true"
                />
                <span>{label}</span>
                <span className={`${mobile ? "ml-auto" : ""} shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium leading-none`}>
                  Em breve
                </span>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function DesktopNavigation() {
  return (
    <nav aria-label="Navegação principal" className="hidden min-w-0 xl:block">
      <NavigationItems />
    </nav>
  )
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 xl:hidden"
            aria-label="Abrir menu de navegação"
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent side="right" className="w-[min(22rem,100%)] gap-0 overflow-y-auto p-4">
        <div className="flex min-h-full flex-col rounded-xl border border-border/70 bg-card">
          <SheetHeader className="p-5 pr-12 text-left">
            <SheetTitle className="text-xl font-black tracking-tight">
              CINEASTRA<span className="text-primary">.</span>
            </SheetTitle>
          </SheetHeader>

          <TearLine />

          <nav aria-label="Navegação mobile" className="flex-1 px-3">
            <NavigationItems mobile onNavigate={() => setOpen(false)} />
          </nav>

          <TearLine />

          <div className="space-y-2 p-5">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <UserRound className="size-4" aria-hidden="true" />
              Entrar
            </Link>
            <Link
              href="/auth/cadastro"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              Criar conta
            </Link>
          </div>

          <TearLine />

          <div className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">Tema do aplicativo</span>
              <AppearanceSelector />
            </div>
            <Barcode />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
