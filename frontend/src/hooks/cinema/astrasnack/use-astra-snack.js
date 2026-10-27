"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { PRODUCTS, SECTIONS } from "@/components/cinema/astrasnack/data";

export function useAstraSnack() {
  const [category, setCategory] = useState("todos")
  const [query, setQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount: cartCount, addItem } = useCart()

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const categoryMatch = category === "todos" || product.categoryId === category
      const queryMatch =
        !query ||
        product.name?.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())

      return categoryMatch && queryMatch
    })
  }, [category, query])

  const openProduct = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setDrawerOpen(true)
  }

  const handleAddToCart = (product, amount) => {
    addItem({ ...product, type: "snack", category: product.category || "AstraSnack" }, amount)
    setDrawerOpen(false)
  }

  const sections = SECTIONS.map((section) => ({
    ...section,
    products: filteredProducts.filter((product) => product.categoryId === section.id),
  }));
  const productTotal = selectedProduct ? Number(selectedProduct.price) * quantity : 0;
  const decreaseQuantity = () => setQuantity((value) => Math.max(1, value - 1));
  const increaseQuantity = () => setQuantity((value) => value + 1);

  return {
    category, setCategory, query, setQuery, selectedProduct, drawerOpen, setDrawerOpen,
    quantity, cartOpen, setCartOpen, cartCount, filteredProducts, sections,
    openProduct, handleAddToCart, productTotal, decreaseQuantity, increaseQuantity,
  };
}
