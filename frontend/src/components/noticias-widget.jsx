"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clapperboard,
  Newspaper,
  Theater,
  Trees,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDraggableFab } from "@/hooks/use-draggable-fab";

/* ============ DADOS (resumo das notícias do site) ============ */
// ⚠ Confirme data e horários antes de publicar (mesmos valores do mural).
const EVENTO = {
  filme: "Vingadores: Doomsday",
  data: "Sáb, 14 Nov",
  abertura: "18:00",
  inicio: "19:30",
};

const ATUALIZADO_EM = "22 de outubro de 2026";

const NOTICIAS = [
  {
    id: "n-2",
    categoria: "Transmissões",
    titulo: `${EVENTO.filme} ao ar livre`,
    resumo: "Sessão gratuita no Parque Linear de São Caetano do Sul. Leve cadeira e manta.",
    icon: Clapperboard,
    destaque: true,
  },
  {
    id: "n-1",
    categoria: "Parcerias",
    titulo: "Parceria com o Parque Linear",
    resumo: "Cinema e cultura dentro do parque, abertos à comunidade.",
    icon: Trees,
  },
  {
    id: "n-3",
    categoria: "Parcerias",
    titulo: "Conversas com teatros e cinemas",
    resumo: "Rede cultural local com programação conjunta.",
    icon: Theater,
  },
  {
    id: "n-5",
    categoria: "Comunidade",
    titulo: "Indique o próximo filme",
    resumo: "Sugira títulos e locais para as próximas sessões.",
    icon: Users,
  },
];

const BTN = 48; // tamanho do botão (px)
const PANEL_W = 352; // largura do painel (22rem)

/* ============ COMPONENTE ============ */
export function NoticiasWidget({ className }) {
  const [open, setOpen] = useState(false);
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

  const [destaque, ...demais] = NOTICIAS;

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
            <article className="mb-3 rounded-xl border border-primary/60 bg-secondary p-4 text-secondary-foreground">
              <div className="mb-2 flex items-center justify-between">
                <destaque.icon className="size-5 text-primary" aria-hidden="true" />
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  Manchete
                </span>
              </div>
              <h3 className="text-sm font-extrabold leading-snug">{destaque.titulo}</h3>
              <p className="mt-1 text-xs opacity-80">{destaque.resumo}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {EVENTO.data} · Portões {EVENTO.abertura} · Sessão {EVENTO.inicio}
              </p>
            </article>

            {/* Demais notícias */}
            <ul className="grid gap-2">
              {demais.map((n) => (
                <li key={n.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
                  <n.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">{n.categoria}</span>
                    <h3 className="text-[13px] font-bold leading-snug">{n.titulo}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.resumo}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodapé */}
          <footer className="border-t-2 border-dashed border-border px-5 pb-4 pt-4">
            <Button asChild className="w-full rounded-full font-bold">
              <Link href="/cinema/noticias" onClick={() => setOpen(false)}>
               CineAstra News
              </Link>
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Atualizado em {ATUALIZADO_EM}</p>
          </footer>
        </section>
      )}
    </div>,
    document.body,
  );
}

export default NoticiasWidget;