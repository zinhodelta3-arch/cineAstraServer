"use client"

import { useId, useState, useSyncExternalStore } from "react"
import { Check, Monitor, Moon, Palette, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useAppearance } from "@/components/providers/appearance-provider"
import { themeMode, useAccountPreferences } from "@/components/providers/account-preferences-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { appearances, isNoirAppearance } from "@/lib/themes"

const modes = [
  { value: "light", label: "Claro", icon: Sun, accountValue: "CLARO" },
  { value: "dark", label: "Escuro", icon: Moon, accountValue: "ESCURO" },
  { value: "system", label: "Sistema", icon: Monitor, accountValue: "SISTEMA" },
]

const siteThemes = new Set(["cineastra", "violet-bloom", "mocha-mousse", "catppucin", "doomsday", "noir", "noir-grafico"])
const collections = [
  { label: "Paletas do site", themes: appearances.filter(({ value }) => siteThemes.has(value)) },
  { label: "Cinema 2026", themes: appearances.filter(({ description }) => description.endsWith("· 2026")) },
  { label: "Outros temas de filmes", themes: appearances.filter(({ value, description }) => !siteThemes.has(value) && !description.endsWith("· 2026")) },
]

const emptySubscribe = () => () => {}
const normalize = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase()

export function AppearanceSelector() {
  const id = useId()
  const [query, setQuery] = useState("")
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const { theme = "system", setTheme } = useTheme()
  const { appearance, setAppearance } = useAppearance()
  const account = useAccountPreferences()
  const accountBusy = Boolean(account && (!account.data || account.saving))

  const selectedMode = account?.data ? themeMode[account.data.tema] : mounted ? theme : "system"
  const selectedAppearance = account?.data?.aparencia || appearance
  const activeTheme = appearances.find(({ value }) => value === selectedAppearance)
  const search = normalize(query)
  const visibleCollections = collections.map(({ label, themes }) => ({
    label,
    themes: themes.filter((item) => normalize(`${item.label} ${item.description} ${label}`).includes(search)),
  })).filter(({ themes }) => themes.length)

  return (
    <Dialog onOpenChange={(open) => { if (!open) setQuery("") }}>
      <DialogTrigger render={<Button variant="outline" size="sm" aria-label="Abrir configurações de aparência" />}>
        <Palette aria-hidden="true" />
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="z-[80] grid max-h-[min(90dvh,50rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-lg border border-border bg-popover p-0 sm:max-w-3xl motion-reduce:animate-none">
        <header className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-6">
          <div aria-hidden="true" className="mb-3 h-1 bg-[repeating-linear-gradient(90deg,var(--primary)_0_11px,transparent_11px_24px)] opacity-60" />
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <DialogTitle className="text-2xl font-black tracking-tight sm:text-3xl">Aparência</DialogTitle>
            {activeTheme && <p className="text-sm text-muted-foreground">Tema atual <strong className="ml-1 text-foreground">{activeTheme.label}</strong></p>}
          </div>
          <DialogDescription className="mt-1">Escolha o modo e a paleta de cores do CineAstra.</DialogDescription>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {account?.error && (
            <div className="mb-4 rounded-md border border-border p-3" role="alert">
              <p>{account.error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={account.retry}>Tentar novamente</Button>
            </div>
          )}

          <fieldset disabled={accountBusy} className="min-w-0">
            <legend className="mb-2 font-bold">Modo</legend>
            <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-muted/40 p-1">
              {modes.map(({ value, label, icon: Icon, accountValue }) => (
                <label key={value} className="relative min-w-0">
                  <input
                    type="radio"
                    name={`${id}-mode`}
                    value={value}
                    checked={selectedMode === value}
                    onChange={() => { if (account) void account.save({ tema: accountValue }); else setTheme(value); }}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-10 cursor-pointer flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-sm border border-transparent p-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground peer-checked:border-primary peer-checked:bg-background peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-default peer-disabled:opacity-65 sm:text-sm">
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {isNoirAppearance(selectedAppearance) && (
            <p className="mt-2 text-xs text-muted-foreground">Noir tem a mesma paleta nos três modos. Sua preferência de modo volta a valer ao escolher outro tema.</p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <h3 id={`${id}-themes`} className="font-bold">Temas</h3>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input type="search" aria-label="Buscar tema" placeholder="Buscar tema" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-9" />
            </div>
          </div>

          <fieldset aria-labelledby={`${id}-themes`} disabled={accountBusy} className="mt-3 min-w-0 space-y-5">
            {visibleCollections.map(({ label, themes }) => (
              <section key={label} aria-label={label}>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">{label}</h4>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {themes.map(({ value, label, description, preview }) => (
                    <label key={value} className="relative min-w-0">
                      <input
                        type="radio"
                        name={`${id}-appearance`}
                        value={value}
                        checked={selectedAppearance === value}
                        onChange={() => { if (account) void account.save({ aparencia: value }); else setAppearance(value); }}
                        className="peer sr-only"
                      />
                      <span className="flex h-full cursor-pointer flex-col overflow-hidden rounded-md border border-border bg-background hover:border-primary/60 peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-default peer-disabled:opacity-65">
                        <span aria-hidden="true" className="relative grid h-8 grid-cols-[2fr_1fr_1fr] border-b border-border sm:h-10">
                          {preview.map((color) => <span key={color} style={{ backgroundColor: color }} />)}
                          {selectedAppearance === value && (
                            <span className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background text-foreground ring-1 ring-foreground/20"><Check className="size-4" /></span>
                          )}
                        </span>
                        <span className="flex flex-1 flex-col gap-0.5 px-2 py-2 sm:px-3">
                          <span className="text-xs leading-snug font-bold wrap-break-word sm:text-sm">{label}</span>
                          <span className="text-[11px] leading-snug text-muted-foreground">{description.replace(" · 2026", "")}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
            {!visibleCollections.length && <p role="status" className="py-3 text-sm text-muted-foreground">Nenhum tema encontrado.</p>}
          </fieldset>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-dashed border-border px-4 py-3 sm:px-6">
          <span role="status" className="mr-auto text-xs text-muted-foreground">
            {account?.saving ? "Salvando preferência…" : accountBusy && !account?.error ? "Carregando preferências…" : ""}
          </span>
          <DialogClose render={<Button variant="outline" size="sm" className="min-h-9" />}>Fechar</DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
