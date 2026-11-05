"use client";

import { Popcorn } from "lucide-react";
import ProductPrice from './product-price';

export default function ProductCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="astra-card overflow-hidden rounded-xl border border-border/70 bg-card text-left"
    >
      <div className="relative aspect-square bg-muted">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Popcorn className="size-12 text-muted-foreground/30" />
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase">
            {product.badge}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="text-[10px] font-bold tracking-[.18em] text-muted-foreground uppercase">
          {product.category}
        </div>
        <h3 className="font-bold">{product.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
          {product.inStock===false?<span className="text-sm text-muted-foreground">Indisponível</span>:product.requiresQuote?(
            product.pricing?.error?<span className="text-xs text-muted-foreground">Não foi possível cotar. Abra os detalhes para tentar novamente.</span>:
            product.pricing?<ProductPrice price={product.pricing.unitPrice} originalPrice={product.pricing.originalPrice} discountSources={product.pricing.discountSources} note="Preço para sua conta, sem cupom"/>:
            <span role="status" className="text-xs text-muted-foreground">Consultando preço…</span>
          ):<ProductPrice price={product.price} note="Preço de catálogo. Entre para consultar descontos."/>}
          <span className="text-xs font-semibold text-primary">Ver detalhes →</span>
        </div>
      </div>
    </button>
  )
}
