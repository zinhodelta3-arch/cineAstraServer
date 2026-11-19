"use client";

import ProductPrice from './product-price';
import ProductImage from './product-image';
import styles from '../ticket.module.css';

export default function ProductCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className={`${styles.ticket} flex h-full flex-col overflow-hidden text-left motion-safe:transition-colors hover:border-primary`}
    >
      <div className="relative aspect-square w-full bg-muted">
        <ProductImage src={product.image} alternatives={[product.alternateImage]} className="h-full w-full" showMissing />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-sm bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground uppercase">
            {product.badge}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="text-[10px] font-bold tracking-[.18em] text-muted-foreground uppercase">
          {product.category}
        </div>
        <h3 className={`${styles.title} line-clamp-2 h-[2.5em] overflow-hidden text-2xl leading-tight font-black [overflow-wrap:anywhere]`}>{product.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
      </div>
      <div className="mt-auto w-full">
        <div className={styles.tear} aria-hidden="true" />
        <div className={`${styles.stub} flex flex-wrap items-end justify-between gap-2 p-4`}>
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
