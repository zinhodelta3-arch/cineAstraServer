"use client";

import { Sparkles } from "lucide-react";
import { PRODUCTS } from "./data";
import { SectionHeading, EmptyProductStrip } from "./catalog-ui";
import ProductCard from "./product-card";

export default function ProductCatalog({ snack }) {
  const { sections, filteredProducts, openProduct } = snack;
  return (
        <div className="space-y-12">
          {sections.map((section) => {
            const sectionProducts = section.products

            return (
              <section key={section.id}>
                <SectionHeading
                  eyebrow="AstraSnack"
                  title={section.title}
                  description={
                    PRODUCTS.length
                      ? "Produtos disponíveis no catálogo."
                      : "Espaço reservado para o catálogo que será carregado pelo backend."
                  }
                />

                {sectionProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {sectionProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onOpen={openProduct} />
                    ))}
                  </div>
                ) : (
                  <EmptyProductStrip tone={section.tone} count={section.count} />
                )}
              </section>
            )
          })}

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Catálogo"
                title="Todos os produtos"
                description="A grade completa será alimentada pelo backend do AstraSnack."
              />
              {PRODUCTS.length > 0 && (
                <span className="mb-5 text-xs text-muted-foreground">{filteredProducts.length} itens</span>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onOpen={openProduct} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-background">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <h3 className="f-display text-2xl font-black">Catálogo pronto para receber os produtos.</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Nenhum produto real foi cadastrado nesta etapa. Quando o backend entregar os itens, eles aparecerão aqui automaticamente e poderão abrir o drawer lateral de detalhes.
                </p>
              </div>
            )}
          </section>
        </div>
  );
}
