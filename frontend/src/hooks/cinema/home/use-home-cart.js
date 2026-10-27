"use client";

import { useEscapeClose } from "./use-escape-close";

export function useHomeCart(items, onClose) {
  useEscapeClose(onClose);
  return { total: items.reduce((acc, item) => acc + (item.price || 0), 0) };
}
