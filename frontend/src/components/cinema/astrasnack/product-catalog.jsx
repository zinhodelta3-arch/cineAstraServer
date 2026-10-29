"use client";
import ProductCard from './product-card';
import ListStatus from '@/components/cinema/home/list-status';
export default function ProductCatalog({snack}){
 if(!snack.localId)return <p className="py-12 text-center text-muted-foreground">Escolha um cinema para consultar produtos e combos.</p>;
 return <div><p className="mb-5 text-sm text-muted-foreground">{snack.filteredProducts.length} itens na parte carregada. Preços publicados; a cotação confirma o valor para sua conta.</p>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{snack.filteredProducts.map(p=><ProductCard key={p.id} product={p} onOpen={snack.openProduct}/>)}</div>
  {!snack.filteredProducts.length&&!snack.snacks.loading&&!snack.combos.loading&&!snack.snacks.error&&!snack.combos.error&&<p className="py-10 text-center">Nenhum produto encontrado nesta parte do catálogo. {snack.snacks.cursor||snack.combos.cursor?'Carregue mais itens para ampliar a busca.':'Tente outro filtro ou cinema.'}</p>}
  <section aria-label="Carregamento de produtos avulsos"><ListStatus list={snack.snacks} empty="" more="Carregar mais produtos"/></section><section aria-label="Carregamento de combos"><ListStatus list={snack.combos} empty="" more="Carregar mais combos"/></section>
 </div>;
}
