"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  Newspaper,
  Info,
  Trees,
  Users,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { articlePath, newsPath } from "@/lib/content/cineastra-news.mjs";
import { publicGet } from "@/lib/api/public-api.mjs";
import { cn } from "@/lib/utils";
import { useDraggableFab } from "@/hooks/use-draggable-fab";

const newsIcons = { Parcerias: Trees, "Transmissões": Clapperboard, Comunidade: Users, Avisos: Info };

const BTN = 48; // tamanho do botão (px)
const PANEL_W = 352; // largura do painel (22rem)

/* ============ COMPONENTE ============ */
export function NoticiasWidget({ className }) {
  const [open, setOpen] = useState(false);
  const [edition, setEdition] = useState(null);
  const [newsError, setNewsError] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const titleId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const { pos, painelStyle, buttonProps } = useDraggableFab({
    storageKey: "cineastra:noticias-pos",
    size: BTN,
    // direita, um pouco abaixo do meio (o de acessibilidade fica no meio)
    defaultPosition: (vw, vh) => ({ x: vw - BTN - 16, y: vh / 2 + 40 }),
    onToggle: () => setOpen((v) => !v),
  });

  // Esc fecha e devolve o foco ao botão
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open || pathname?.startsWith("/cinema/noticias")) return;
    const controller = new AbortController();
    publicGet("/news?limit=4", { signal: controller.signal })
      .then(data => { setEdition(data.items); setNewsError(false); })
      .catch(() => { if (!controller.signal.aborted) setNewsError(true); });
    return () => controller.abort();
  }, [open, pathname]);
  const destaque = edition?.find(item => item.destaque) ?? edition?.[0];
  const demais = edition?.filter(item => item.id !== destaque?.id) ?? [];
  const HeadlineIcon = newsIcons[destaque?.categoria] ?? Newspaper;
  // Não mostra o widget dentro da própria página de notícias
  if (pathname?.startsWith("/cinema/noticias")) return null;
  if (!pos) return null; // aguarda a posição (evita piscar / erro de hidratação)

  return createPortal(
    <div ref={rootRef}>
      {/* Botão flutuante (amarelo, lateral direita) */}
      {/* Mesma classe do botão de acessibilidade: formato, cor e sombra idênticos */}
      <Button
        ref={triggerRef}
        type="button"
        {...buttonProps}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Abrir notícias do CineAstra. Arraste ou use as setas para mover."
        title="Notícias (arraste para mover)"
        className={cn("ca-a11y-trigger", className)}
      >
        <Newspaper className="size-6" strokeWidth={1.8} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background bg-secondary" aria-hidden="true" />
      </Button>

      {/* Painel */}
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          style={painelStyle(PANEL_W)}
          className="fixed flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        >
          {/* Cabeçalho amarelo */}
          <header className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <Newspaper className="size-5" aria-hidden="true" />
              <h2 id={titleId} className="text-base font-extrabold">
                Notícias
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Fechar notícias"
              className="rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          {/* Corpo com perfuração à esquerda */}
          <div className="relative flex-1 overflow-y-auto py-5 pl-9 pr-5">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-2 w-3.5 opacity-80 bg-[repeating-linear-gradient(180deg,var(--border)_0_12px,transparent_12px_26px)]"
            />

            <p className="text-sm font-bold">Novidades do CineAstra</p>
            <p className="mb-4 text-xs text-muted-foreground">Resumo do que está acontecendo.</p>

            {/* Manchete */}
            {destaque && <article className="mb-3 rounded-xl border border-primary/60 bg-secondary p-4 text-secondary-foreground">
              <div className="mb-2 flex items-center justify-between">
                <HeadlineIcon className="size-5 text-primary" aria-hidden="true" />
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  Manchete
                </span>
              </div>
              <h3 className="text-sm font-extrabold leading-snug">
                <Link href={articlePath(destaque.id)} prefetch={false} onClick={() => setOpen(false)} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{destaque.titulo}</Link>
              </h3>
              <p className="mt-1 text-xs opacity-80">{destaque.resumo}</p>
            </article>}
            {newsError && <p role="status" className="text-sm text-muted-foreground">Não foi possível atualizar as notícias.</p>}
            {!edition && !newsError && <p role="status" className="text-sm text-muted-foreground">Carregando notícias…</p>}
            {edition?.length === 0 && !newsError && <p className="text-sm text-muted-foreground">Nenhuma notícia publicada.</p>}
            {/* Demais notícias */}
            <ul className="grid gap-2">
              {demais.map(n => {
                const Icon = newsIcons[n.categoria] ?? Newspaper;
                return (
                <li key={n.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">{n.categoria}</span>
                    <h3 className="text-[13px] font-bold leading-snug">
                      <Link href={articlePath(n.id)} prefetch={false} onClick={() => setOpen(false)} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{n.titulo}</Link>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.resumo}</p>
                  </div>
                </li>
              ); })}
            </ul>
          </div>

          {/* Rodapé */}
          <footer className="border-t-2 border-dashed border-border px-5 pb-4 pt-4">
            <Link href={newsPath} prefetch={false} onClick={() => setOpen(false)}
              className={buttonVariants({ className: "min-h-11 w-full rounded-full font-bold" })}>
              Abrir CineAstraNews
            </Link>
          </footer>
        </section>
      )}
    </div>,
    document.body,
  );
}

export default NoticiasWidget;
