"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Film, Bell, Menu, UserRound, CircleHelp, X } from "lucide-react";
import { AppearanceSelector } from "@/components/appearance-selector";

import SessionControls from "@/components/auth/session-controls";

/* ============ CABEÇALHO EXCLUSIVO DO STREAMING ============ */
export default function StreammingHeader({ notifications = [] }) {
  const pathname = usePathname() ?? "/streaming";
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigation = [
    { label: "Filmes", href: "/streaming", icon: Film },
    { label: "Minha CineAstra", href: "/streaming/meuperfil", icon: UserRound },
    { label: "Suporte", href: "/cinema/suporte", icon: CircleHelp },
  ];

  const isActive = (href) => {
    if (href === "/streaming") return pathname === "/streaming";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navClass = (active) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 text-foreground backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1800px] items-center justify-between gap-3 px-4 md:px-12">
        <Link
          href="/streaming"
          aria-label="CineAstra Streaming — início"
          className="shrink-0 text-xl font-black tracking-tight sm:text-2xl"
        >
          CINEASTRA<span className="text-primary">.</span>
          <span className="ml-2 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground xl:inline">
            Streaming
          </span>
        </Link>

        <nav aria-label="Navegação do streaming" className="hidden items-center gap-1 lg:flex">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={navClass(isActive(href))}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <div className="relative">
            <button
              type="button"
              aria-label="Notificações"
              aria-expanded={notificationsOpen}
              title="Notificações"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell className="size-5" aria-hidden="true" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-label="Há notificações novas" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-xl border border-border bg-background p-4 text-foreground shadow-xl sm:w-80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-bold">Notificações</h2>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Fechar
                  </button>
                </div>
                {notifications.length ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {notifications.map((item, index) => (
                      <div key={item.id ?? index} className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm font-semibold">{item.title ?? item.message ?? "Notificação"}</p>
                        {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-muted-foreground">Você não tem notificações novas.</p>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block">
            <AppearanceSelector />
          </div>

          <div className="hidden sm:block"><SessionControls /></div>

          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav aria-label="Navegação mobile do streaming" className="flex flex-col gap-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={navClass(isActive(href))}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-border pt-3 sm:hidden">
              <span className="text-sm text-muted-foreground">Tema do aplicativo</span>
              <AppearanceSelector />
            </div>
            <div className="mt-3 sm:hidden"><SessionControls /></div>
          </nav>
        </div>
      )}
    </header>
  );
}

