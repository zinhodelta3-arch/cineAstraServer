"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const FAB_Z_MAX = 2147483647; // acima de qualquer elemento da página

const MARGEM = 8;
const DRAG_LIMIAR = 5; // px de movimento para contar como arrasto

const limitar = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Botão flutuante arrastável (mouse, toque e setas do teclado), com posição salva.
 *
 * @param {object}   opts
 * @param {string}   opts.storageKey      chave do localStorage (use uma diferente por botão)
 * @param {number}   [opts.size=48]       tamanho do botão em px
 * @param {function} opts.defaultPosition (vw, vh) => ({ x, y }) posição inicial
 * @param {function} opts.onToggle        chamado em clique simples (não em arrasto)
 */
export function useDraggableFab({ storageKey, size = 48, defaultPosition, onToggle }) {
  const [pos, setPos] = useState(null); // null até montar no navegador
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ ativo: false, moveu: false, dx: 0, dy: 0, sx: 0, sy: 0 });
  const foiArrasto = useRef(false);
  const defaultRef = useRef(defaultPosition);
  defaultRef.current = defaultPosition;

  const clampPos = useCallback(
    (x, y) => ({
      x: limitar(x, MARGEM, window.innerWidth - size - MARGEM),
      y: limitar(y, MARGEM, window.innerHeight - size - MARGEM),
    }),
    [size],
  );

  const salvar = useCallback(
    (p) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            rx: p.x / Math.max(1, window.innerWidth - size),
            ry: p.y / Math.max(1, window.innerHeight - size),
          }),
        );
      } catch {}
    },
    [storageKey, size],
  );

  useEffect(() => {
    const d = defaultRef.current(window.innerWidth, window.innerHeight);
    let inicial = clampPos(d.x, d.y);
    try {
      const s = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (s && typeof s.rx === "number" && typeof s.ry === "number") {
        inicial = clampPos(s.rx * (window.innerWidth - size), s.ry * (window.innerHeight - size));
      }
    } catch {}
    setPos(inicial);
  }, [clampPos, storageKey, size]);

  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPos]);

  const onPointerDown = (e) => {
    if (!pos || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { ativo: true, moveu: false, dx: e.clientX - pos.x, dy: e.clientY - pos.y, sx: e.clientX, sy: e.clientY };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.ativo) return;
    if (!d.moveu && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_LIMIAR) return;
    if (!d.moveu) {
      d.moveu = true;
      setDragging(true);
    }
    setPos(clampPos(e.clientX - d.dx, e.clientY - d.dy));
  };

  const posRef = useRef(pos);
  posRef.current = pos;

  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d.ativo) return;
    d.ativo = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d.moveu) {
      foiArrasto.current = true; // impede o clique que vem logo após soltar
      setTimeout(() => (foiArrasto.current = false), 0); // o clique dispara antes disto
      setDragging(false);
      if (posRef.current) salvar(posRef.current);
    }
  };

  const onClick = () => {
    if (foiArrasto.current) return;
    onToggle?.();
  };

  /** true logo após soltar um arrasto (use para ignorar toggles gerados pelo clique de soltar). */
  const wasDragged = () => foiArrasto.current;

  const onKeyDown = (e) => {
    const passo = e.shiftKey ? 48 : 16;
    const mov = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
    if (!mov || !pos) return;
    e.preventDefault();
    const novo = clampPos(pos.x + mov[0], pos.y + mov[1]);
    setPos(novo);
    salvar(novo);
  };

  /** Estilo do painel: abre para o lado e o sentido com mais espaço. */
  const painelStyle = (largura) => {
    if (!pos) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(largura, vw * 0.92);
    const left = limitar(pos.x + size / 2 > vw / 2 ? pos.x + size - w : pos.x, MARGEM, vw - w - MARGEM);
    const abaixo = pos.y + size / 2 < vh / 2;
    return abaixo
      ? { left, top: pos.y + size + MARGEM, width: w, maxHeight: vh - (pos.y + size + MARGEM) - MARGEM, zIndex: FAB_Z_MAX }
      : { left, bottom: vh - pos.y + MARGEM, width: w, maxHeight: pos.y - MARGEM * 2, zIndex: FAB_Z_MAX };
  };

  return {
    pos,
    dragging,
    painelStyle,
    wasDragged,
    buttonProps: {
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
      style: pos
        ? {
            position: "fixed",
            left: pos.x,
            top: pos.y,
            right: "auto",
            bottom: "auto",
            transform: "none",
            width: size,
            height: size,
            zIndex: FAB_Z_MAX,
            touchAction: "none",
            userSelect: "none",
            cursor: dragging ? "grabbing" : "grab",
          }
        : undefined,
    },
  };
}