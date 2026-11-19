"use client"

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react"
import { useSession } from "@/hooks/auth/use-session"
import { accountCartKey, cartChanged, guestCartKey, parseCart, readCartSnapshot, updateCart } from "@/lib/api/local-cart.mjs"

const CartContext = createContext(null)
const emptySnapshot = () => null

function subscribe(onChange) {
  window.addEventListener("storage", onChange)
  window.addEventListener(cartChanged, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(cartChanged, onChange)
  }
}

export function CartProvider({ children }) {
  const { user, loading } = useSession()
  const key = loading ? null : !user ? guestCartKey : user.role === "CLIENTE" ? accountCartKey(user.id) : null
  const getSnapshot = useCallback(() => readCartSnapshot(key), [key])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, emptySnapshot)
  const { items, savedForLater } = useMemo(() => parseCart(snapshot), [snapshot])
  const setItems = useCallback(update => {
    updateCart(key, current => {
      const next = update(current.items)
      return next === current.items ? current : { ...current, items: next }
    })
  }, [key])

  const addItem = useCallback((product, quantity = 1) => {
    const amount = product.purchaseKind === 'SESSION' ? 1 : Math.min(100, Math.max(1, Math.floor(Number(quantity) || 1)))
    const item = {
      id: String(product.id),
      type: product.type || "snack",
      name: product.name || "Produto CineAstra",
      description: product.description || "",
      category: product.category || (product.type === "ticket" ? "Ingresso" : "AstraSnack"),
      price: Math.max(0, Number(product.price) || 0),
      originalPrice: product.originalPrice ?? null,
      discountSources: Array.isArray(product.discountSources) ? product.discountSources : [],
      image: product.image || "",
      details: product.details || "",
      ...(product.purchaseKind === 'COMBO' && product.eventSessionId ? {eventSessionId:String(product.eventSessionId)} : {}),
      ...(product.sourceId && product.localId && ["INPUT", "COMBO", "SESSION"].includes(product.purchaseKind) ? {sourceId:String(product.sourceId),localId:String(product.localId),purchaseKind:product.purchaseKind,...(product.purchaseKind === "SESSION" && product.seatId ? {seatId:String(product.seatId),halfDeclaration:product.halfDeclaration} : {})} : {}),
    }
    setItems((current) => {
      const existing = current.find((entry) => item.purchaseKind === 'SESSION' ? entry.purchaseKind === 'SESSION' && entry.sourceId === item.sourceId && entry.seatId === item.seatId : entry.id === item.id && entry.type === item.type && entry.details === item.details)
      if (existing) return current.map((entry) => entry === existing ? { ...entry, ...item, quantity: item.purchaseKind === 'SESSION' ? 1 : Math.min(100, entry.quantity + amount) } : entry)
      return [...current, { ...item, quantity: amount }]
    })
  }, [setItems])

  const updateQuantity = useCallback((id, type, details, quantity) => {
    const amount = Number(quantity)
    if (!Number.isFinite(amount)) return
    setItems((current) => amount <= 0
      ? current.filter((item) => !(item.id === id && item.type === type && item.details === details))
      : current.map((item) => item.id === id && item.type === type && item.details === details ? { ...item, quantity: item.purchaseKind === 'SESSION' ? 1 : Math.min(100, Math.max(1, Math.floor(amount))) } : item))
  }, [setItems])

  const removeItem = useCallback((id, type, details = "") => {
    setItems((current) => current.filter((item) => !(item.id === id && item.type === type && item.details === details)))
  }, [setItems])

  const updatePrices = useCallback((expectedItems, quotes) => {
    if (quotes.length !== expectedItems.length || quotes.some(quote => !quote || !Number.isFinite(Number(quote.unitPrice)) || Number(quote.unitPrice) < 0)) return
    // Uma resposta antiga não deve substituir itens alterados durante a consulta.
    setItems(current => JSON.stringify(current) !== JSON.stringify(expectedItems) ? current : current.map((item, index) => ({
      ...item,
      price: Number(quotes[index].unitPrice),
      originalPrice: quotes[index].originalPrice ?? null,
      discountSources: Array.isArray(quotes[index].discountSources) ? quotes[index].discountSources : [],
    })))
  }, [setItems])

  const clearCart = useCallback(() => setItems(() => []), [setItems])
  const resumeSavedItems = useCallback(() => {
    updateCart(key, current => {
      if (current.items.length || !current.savedForLater.length) return current
      const [first, ...rest] = current.savedForLater
      const items = [first]
      const savedForLater = []
      for (const item of rest) {
        const fits = item.localId === first.localId && !items.some(entry => entry.id === item.id)
          && items.length < 50 && items.reduce((total, entry) => total + entry.quantity, item.quantity) <= 500
        if (fits) items.push(item)
        else savedForLater.push(item)
      }
      return { items, savedForLater }
    })
  }, [key])
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const value = useMemo(() => ({ items, itemCount, total, addItem, updateQuantity, updatePrices, removeItem, clearCart, savedForLater, resumeSavedItems }), [items, itemCount, total, addItem, updateQuantity, updatePrices, removeItem, clearCart, savedForLater, resumeSavedItems])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart precisa ser usado dentro de CartProvider")
  return context
}
