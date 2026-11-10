"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"

const CartContext = createContext(null)
const STORAGE_KEY = "cineastra:cart:v1"
const noSubscription = () => () => {}
const emptySnapshot = () => null

function savedCartSnapshot() {
  try { return localStorage.getItem(STORAGE_KEY) }
  catch { return null }
}

function readItems(snapshot) {
  try {
    const saved = JSON.parse(snapshot || "[]")
    if (Array.isArray(saved)) {
      return saved
        .filter(item => item && item.id && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0)
        .map(item => ({ ...item, quantity: Number(item.quantity) }))
    }
  } catch {
    // Mantém o carrinho vazio se o armazenamento estiver indisponível.
  }
  return []
}

export function CartProvider({ children }) {
  const snapshot = useSyncExternalStore(noSubscription, savedCartSnapshot, emptySnapshot)
  const savedItems = useMemo(() => readItems(snapshot), [snapshot])
  const [updatedItems, setUpdatedItems] = useState(null)
  const items = updatedItems ?? savedItems
  const setItems = useCallback(update => {
    setUpdatedItems(current => update(current ?? savedItems))
  }, [savedItems])

  useEffect(() => {
    if (!updatedItems) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems))
    } catch {
      // O carrinho continua funcional durante a sessão mesmo sem armazenamento persistente.
    }
  }, [updatedItems])

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
      ...(product.sourceId && product.localId && ["INPUT", "COMBO", "SESSION"].includes(product.purchaseKind) ? {sourceId:String(product.sourceId),localId:String(product.localId),purchaseKind:product.purchaseKind,...(product.purchaseKind === "SESSION" && product.seatId ? {seatId:String(product.seatId)} : {})} : {}),
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
    setItems(current => current !== expectedItems ? current : current.map((item, index) => ({
      ...item,
      price: Number(quotes[index].unitPrice),
      originalPrice: quotes[index].originalPrice ?? null,
      discountSources: Array.isArray(quotes[index].discountSources) ? quotes[index].discountSources : [],
    })))
  }, [setItems])

  const clearCart = useCallback(() => setUpdatedItems([]), [])
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const value = useMemo(() => ({ items, itemCount, total, addItem, updateQuantity, updatePrices, removeItem, clearCart }), [items, itemCount, total, addItem, updateQuantity, updatePrices, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart precisa ser usado dentro de CartProvider")
  return context
}
