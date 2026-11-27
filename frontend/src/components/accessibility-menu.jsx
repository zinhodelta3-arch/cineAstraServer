"use client"

import { useId, useState } from "react"
import { createPortal } from "react-dom"
import {
  Accessibility, Contrast, Type, MoveVertical, MoveHorizontal,
  Pause, Eye, RotateCcw, X, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAccessibility } from "@/hooks/use-accessibility"
import { useDraggableFab } from "@/hooks/use-draggable-fab"
import { ACCESSIBILITY_OPTIONS } from "@/lib/accessibility"

function Adjustment({ icon: Icon, label, value, level, count, onClick, disabled, toggle = false }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="ca-a11y-option"
      data-active={level > 0 ? "true" : "false"}
      aria-label={`${label}: ${value}. ${toggle ? "Alternar ajuste" : "Clique para avançar para a próxima opção"}.`}
      aria-pressed={toggle ? level > 0 : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="ca-a11y-option-top">
        <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
        {level > 0 && <Check className="size-3.5" aria-hidden="true" />}
      </span>
      <span className="ca-a11y-option-label">{label}</span>
      <span className="ca-a11y-option-value">{value}</span>
      <span className="ca-a11y-steps" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <span key={index} data-current={index === level ? "true" : "false"} />
        ))}
      </span>
    </Button>
  )
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const {
    settings, ready, storageAvailable, systemReducedMotion,
    activeCount, cycle, toggleMotion, reset,
  } = useAccessibility()

  // Botão arrastável (posição salva separadamente do botão de notícias)
  const { pos, viewport, buttonProps, wasDragged } = useDraggableFab({
    storageKey: "cineastra:a11y-pos",
    size: 48,
    defaultPosition: (vw, vh) => ({ x: vw - 48 - 16, y: vh / 2 - 24 }),
  })

  const change = (key, label) => {
    const options = ACCESSIBILITY_OPTIONS[key]
    const next = (settings[key] + 1) % options.length
    cycle(key)
    setAnnouncement(`${label}: ${options[next]}.`)
  }

  const controls = [
    { key: "contrast", label: "Contraste", icon: Contrast },
    { key: "font", label: "Texto maior", icon: Type },
    { key: "line", label: "Altura da linha", icon: MoveVertical },
    { key: "spacing", label: "Espaçamento", icon: MoveHorizontal },
  ]

  if (!pos) return null // aguarda a posição no navegador (evita piscar/hidratação)
  const mobile = viewport.width <= 640

  // Portal no body: o botão fica fixo na tela mesmo dentro de header com transform/blur
  return createPortal(
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (wasDragged()) return // soltar o arrasto não deve abrir/fechar o painel
        setOpen(next)
      }}
    >
      {/* Base UI usa render, em vez de asChild. */}
      <PopoverTrigger
        render={<Button type="button" className="ca-a11y-trigger" />}
        aria-label={open ? "Fechar menu de acessibilidade" : "Abrir menu de acessibilidade"}
        title="Acessibilidade (arraste para mover)"
        {...buttonProps}
      >
        <Accessibility className="size-6" strokeWidth={1.8} aria-hidden="true" />
        {activeCount > 0 && (
          <span className="ca-a11y-count" aria-hidden="true">{activeCount}</span>
        )}
      </PopoverTrigger>

      <PopoverContent
        side={
          mobile
            ? pos.y > viewport.top + viewport.height / 2 ? "top" : "bottom"
            : pos.x > viewport.left + viewport.width / 2 ? "left" : "right"
        }
        sideOffset={12}
        align={mobile ? "end" : "center"}
        className="ca-a11y-panel"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="ca-a11y-header">
          <Accessibility className="size-5 shrink-0" aria-hidden="true" />
          <h2 id={titleId} className="ca-a11y-heading">Acessibilidade</h2>
          <Button
            type="button"
            variant="ghost"
            className="ca-a11y-close"
            aria-label="Fechar menu de acessibilidade"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <div className="ca-a11y-body">
          <p id={descriptionId} className="ca-a11y-intro">
            Mais conforto para a sua sessão.
            <span>Clique em um ajuste para alternar os níveis.</span>
          </p>

          <div className="ca-a11y-grid">
            {controls.map(({ key, label, icon }) => (
              <Adjustment
                key={key}
                icon={icon}
                label={label}
                value={ACCESSIBILITY_OPTIONS[key][settings[key]]}
                level={settings[key]}
                count={ACCESSIBILITY_OPTIONS[key].length}
                onClick={() => change(key, label)}
                disabled={!ready}
              />
            ))}
            <Adjustment
              icon={Pause}
              label="Reduzir animações"
              value={systemReducedMotion ? "Ativo pelo sistema" : settings.motion ? "Ativado" : "Padrão do sistema"}
              level={settings.motion || systemReducedMotion ? 1 : 0}
              count={2}
              disabled={!ready || systemReducedMotion}
              toggle
              onClick={() => {
                toggleMotion()
                setAnnouncement(settings.motion ? "Animações: padrão do sistema." : "Redução de animações ativada.")
              }}
            />
            <Adjustment
              icon={Eye}
              label="Daltonismo"
              value={ACCESSIBILITY_OPTIONS.color[settings.color]}
              level={settings.color}
              count={ACCESSIBILITY_OPTIONS.color.length}
              onClick={() => change("color", "Paleta de cores")}
              disabled={!ready}
            />
          </div>

          {settings.color > 0 && (
            <p className="ca-a11y-note">
              Paleta alternativa para a interface. Fotos e vídeos mantêm suas cores.
            </p>
          )}
          {settings.contrast > 0 && settings.color > 0 && (
            <p className="ca-a11y-note">O alto contraste tem prioridade sobre a paleta alternativa.</p>
          )}

          <footer className="ca-a11y-footer">
            <Button
              type="button"
              variant="outline"
              className="ca-a11y-reset"
              disabled={!ready || activeCount === 0}
              onClick={() => {
                reset()
                setAnnouncement("Ajustes restaurados. A preferência de movimento do sistema continua sendo respeitada.")
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Restaurar padrão
            </Button>
            <p className="ca-a11y-save">
              {!ready ? "Carregando preferências…" : storageAvailable
                ? "Preferências salvas neste navegador."
                : "Ajustes ativos nesta sessão. O navegador bloqueou o salvamento."}
            </p>
          </footer>
        </div>
        <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </span>
      </PopoverContent>
    </Popover>,
    document.body,
  )
}

export default AccessibilityMenu
