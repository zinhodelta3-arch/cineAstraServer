"use client";

export default function useOrderDetails(selection, onClose) {
  const { order, view } = selection;
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const changeOpen = (open) => { if (!open) onClose(); };
  return { order, view, subtotal, changeOpen };
}
