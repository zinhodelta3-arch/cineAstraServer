"use client";

import { useEffect, useRef, useState } from "react";

export const FAB_Z_MAX = 2147483647;

const MARGEM = 8;
const DRAG_LIMIAR = 5;
const limitar = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

function viewportAtual() {
  const visual = window.visualViewport;
  return {
    left: visual?.offsetLeft ?? 0,
    top: visual?.offsetTop ?? 0,
    width: visual?.width ?? window.innerWidth,
    height: visual?.height ?? window.innerHeight,
    layoutHeight: window.innerHeight,
  };
}

/** Botão arrastável com a posição salva como proporção da área visível. */
export function useDraggableFab({ storageKey, size = 48, defaultPosition, onToggle }) {
  const [viewport, setViewport] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const foiArrasto = useRef(false);
  const defaultRef = useRef(defaultPosition);
  defaultRef.current = defaultPosition;

  useEffect(() => {
    const visual = window.visualViewport;
    let frame = 0;
    let inicial = true;
    const refresh = () => {
      frame = 0;
      const current = viewportAtual();
      if (inicial) {
        inicial = false;
        let salvo;
        try { salvo = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch {}
        const defaultPos = defaultRef.current(current.width, current.height);
        setAnchor(Number.isFinite(salvo?.rx) && Number.isFinite(salvo?.ry) ? salvo : {
          rx: defaultPos.x / Math.max(1, current.width - size),
          ry: defaultPos.y / Math.max(1, current.height - size),
        });
      }
      setViewport(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(refresh); };
    schedule();
    window.addEventListener("resize", schedule);
    visual?.addEventListener("resize", schedule);
    visual?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      visual?.removeEventListener("resize", schedule);
      visual?.removeEventListener("scroll", schedule);
    };
  }, [storageKey, size]);

  function clampLocal(x, y) {
    return {
      x: limitar(x, MARGEM, viewport.width - size - MARGEM),
      y: limitar(y, MARGEM, viewport.height - size - MARGEM),
    };
  }

  const travelX = Math.max(1, (viewport?.width ?? 0) - size);
  const travelY = Math.max(1, (viewport?.height ?? 0) - size);
  const local = viewport && anchor && clampLocal(anchor.rx * travelX, anchor.ry * travelY);
  const pos = local && { x: local.x + viewport.left, y: local.y + viewport.top };

  function anchorAt(x, y) {
    const p = clampLocal(x - viewport.left, y - viewport.top);
    return { rx: p.x / travelX, ry: p.y / travelY };
  }

  function salvar(next) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }

  function onPointerDown(e) {
    if (!pos || !e.isPrimary || e.button !== 0 || drag.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      id: e.pointerId, moveu: false, inicial: anchor,
      dx: e.clientX - pos.x, dy: e.clientY - pos.y,
      sx: e.clientX, sy: e.clientY,
    };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    if (!d.moveu && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_LIMIAR) return;
    if (!d.moveu) {
      d.moveu = true;
      setDragging(true);
    }
    d.novo = anchorAt(e.clientX - d.dx, e.clientY - d.dy);
    setAnchor(d.novo);
  }

  function finalizarArrasto(e, cancelado = false) {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d.moveu) return;
    foiArrasto.current = true;
    setTimeout(() => { foiArrasto.current = false; }, 0);
    setDragging(false);
    if (cancelado) setAnchor(d.inicial);
    else salvar(d.novo);
  }

  function onKeyDown(e) {
    const passo = e.shiftKey ? 48 : 16;
    const mov = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
    if (!mov || !pos) return;
    e.preventDefault();
    const next = anchorAt(pos.x + mov[0], pos.y + mov[1]);
    setAnchor(next);
    salvar(next);
  }

  function painelStyle(largura) {
    if (!pos) return {};
    const { left: x, top: y, width, height, layoutHeight } = viewport;
    const w = Math.min(largura, width * 0.92);
    const left = limitar(local.x + size / 2 > width / 2 ? pos.x + size - w : pos.x, x + MARGEM, x + width - w - MARGEM);
    const abaixo = local.y + size / 2 < height / 2;
    return abaixo
      ? { left, top: pos.y + size + MARGEM, width: w, maxHeight: height - local.y - size - MARGEM * 2, zIndex: FAB_Z_MAX }
      : { left, bottom: layoutHeight - pos.y + MARGEM, width: w, maxHeight: local.y - MARGEM * 2, zIndex: FAB_Z_MAX };
  }

  return {
    pos,
    viewport,
    painelStyle,
    wasDragged: () => foiArrasto.current,
    buttonProps: {
      onClick: () => { if (!foiArrasto.current) onToggle?.(); },
      onPointerDown,
      onPointerMove,
      onPointerUp: finalizarArrasto,
      onPointerCancel: e => finalizarArrasto(e, true),
      onLostPointerCapture: e => finalizarArrasto(e, true),
      onKeyDown,
      style: pos ? {
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
      } : undefined,
    },
  };
}
