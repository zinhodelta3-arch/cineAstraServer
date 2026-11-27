import ListStatus from "@/components/cinema/home/list-status";
import ProductCard from "./product-card";
import ticket from "../ticket.module.css";

export default function ProductCatalog({ id, title, kind, more, snack }) {
  const list = kind === "COMBO" ? snack.combos : snack.snacks;
  const products = snack.filteredProducts.filter(product => product.purchaseKind === kind);
  const hasSearch = Boolean(snack.query.trim());
  const empty = hasSearch ? "Nenhum resultado nesta seção." : "Nenhum item disponível nesta seção para este cinema.";

  return (
    <section id={id} aria-labelledby={`${id}-title`} tabIndex={-1} className="scroll-mt-40 py-6 md:py-8">
      <h2 id={`${id}-title`} className={`${ticket.title} mb-5 border-b border-dashed border-border pb-3 text-4xl leading-none font-black`}>
        {title}
      </h2>
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map(product => <ProductCard key={product.id} product={product} onOpen={snack.openProduct} />)}
        </div>
      )}
      {!products.length && !list.loading && !list.error && (
        <p className="py-6 text-sm text-muted-foreground">
          {empty} {list.cursor && "Carregue mais itens para ampliar a busca."}
        </p>
      )}
      <ListStatus list={list} empty="" more={more} />
    </section>
  );
}
