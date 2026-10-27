"use client"

import { useRouter } from "next/navigation"
import { useCart } from "@/components/cart/cart-provider"

export default function useCinemaCart() {
  const router = useRouter()
  const { items, itemCount, total, updateQuantity, removeItem } = useCart()
  const increase = (item) => updateQuantity(item.id, item.type, item.details, item.quantity + 1)
  const decrease = (item) => updateQuantity(item.id, item.type, item.details, item.quantity - 1)
  const remove = (item) => removeItem(item.id, item.type, item.details)
  const goBack = () => router.back()
  const checkout = () => router.push("/cinema/pagamento")

  return { items, itemCount, total, increase, decrease, remove, goBack, checkout }
}
