"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PAGE_SIZE, filterOrders, month, nextSession, orderSummary } from "@/components/purchases/purchase-data";

export default function usePurchaseHistory(orders, referenceDate) {
  const [filters, setFilters] = useState({ type: "all", status: "all", period: "all", query: "" });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selection, setSelection] = useState(null);
  const [notice, setNotice] = useState("");
  const returnFocus = useRef(null);
  const matching = useMemo(() => filterOrders(orders, filters, referenceDate), [orders, filters, referenceDate]);
  const upcoming = useMemo(() => nextSession(orders, referenceDate), [orders, referenceDate]);
  const shown = matching.slice(0, visible);
  const groups = new Map();
  for (const order of shown) { const label = month(order.purchasedAt); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(order); }
  const isFiltered = filters.type !== "all" || filters.status !== "all" || filters.period !== "all" || filters.query.trim() !== "";
  const change = (field, value) => { setFilters((old) => ({ ...old, [field]: value })); setVisible(PAGE_SIZE); };
  const clear = () => { setFilters({ type: "all", status: "all", period: "all", query: "" }); setVisible(PAGE_SIZE); };
  const open = (order, element, view = "details") => { returnFocus.current = element; setSelection({ order, view }); };
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timer); }, [notice]);
  const copy = async (id) => {
    try { await navigator.clipboard.writeText(id); setNotice("Código do pedido copiado."); }
    catch { setNotice(`Não foi possível copiar. O código do pedido é ${id}.`); }
  };
  const download = (order) => {
    try {
      const blob = new Blob(["\uFEFF", orderSummary(order)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `CineAstra-${order.id}.txt`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("O download do resumo foi iniciado.");
    } catch { setNotice("Não foi possível baixar o resumo. Tente novamente."); }
  };
  const loadMore = () => setVisible((count) => count + PAGE_SIZE);
  const close = () => setSelection(null);
  const dismissNotice = () => setNotice("");
  const typeTabs = [{ id: "all", label: "Tudo", icon: "archive" }, { id: "cinema", label: "Cinema", icon: "ticket" }, { id: "streaming", label: "Streaming", icon: "play" }].map((tab) => ({ ...tab, count: orders.filter((order) => tab.id === "all" || order.type === tab.id).length }));
  return { filters, visible, selection, notice, returnFocus, matching, upcoming, shown, groups, isFiltered, change, clear, open, copy, download, loadMore, close, dismissNotice, typeTabs };
}
