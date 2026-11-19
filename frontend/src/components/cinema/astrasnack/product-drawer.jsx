"use client";
import {Minus,Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle} from '@/components/ui/sheet';
import ListStatus from '@/components/cinema/home/list-status';
import {publicAsset} from '@/lib/api/public-api.mjs';
import ProductPrice from './product-price';
import ProductImage from './product-image';
export default function ProductDrawer({snack:s}){
 const p=s.selectedProduct;
 const galleryImages=s.gallery.items.map(image=>publicAsset(image.url));
 return <Sheet open={s.drawerOpen} onOpenChange={s.setDrawerOpen}><SheetContent side="right" className="z-[80] !w-[min(28rem,100vw)] gap-0 overflow-y-auto p-0">
  <SheetHeader className="border-b border-border p-5 pr-14"><SheetTitle className="text-2xl font-bold">{p?.name||s.selected?.name||'Produto'}</SheetTitle><SheetDescription>{p?.category||'Detalhes do produto'}</SheetDescription></SheetHeader>
  {s.loadingDetail&&<p role="status" className="p-5">Carregando produto…</p>}{s.detailError&&<div role="alert" className="p-5"><p>{s.detailError}</p><Button onClick={s.retry}>Tentar novamente</Button></div>}
  {p&&<><div className="p-5"><div className="aspect-video overflow-hidden rounded-lg bg-muted"><ProductImage key={p.id} src={p.image} alternatives={[p.alternateImage,...galleryImages]} alt={p.name} className="size-full" fit="object-contain" showMissing /></div><p className="my-5 text-sm">{p.description||'Descrição não informada.'}</p>
   {p.items.length>0&&<ul className="mb-4 text-sm">{p.items.map(i=><li key={i.id_insumo}>{i.quantidade} × {i.nome}</li>)}</ul>}
   <div className="grid grid-cols-2 gap-2">{s.gallery.items.map(i=><ProductImage key={i.id_imagem} src={publicAsset(i.url)} alt={i.texto_alternativo||p.name} className="aspect-square w-full rounded-md" />)}</div><ListStatus list={s.gallery} empty="" more="Mais imagens"/>
   <p className="text-sm">{p.inStock===false?'Indisponível no momento':p.inStock===true?'Disponível no catálogo':'Disponibilidade confirmada no checkout'}</p>
   <div className="my-5 flex items-center justify-between"><span>Quantidade</span><div className="flex items-center gap-4"><Button aria-label="Diminuir quantidade" variant="outline" size="icon" disabled={s.quantity<=1} onClick={s.decreaseQuantity}><Minus/></Button><span aria-live="polite">{s.quantity}</span><Button aria-label="Aumentar quantidade" variant="outline" size="icon" disabled={s.quantity>=100} onClick={s.increaseQuantity}><Plus/></Button></div></div>
  </div><div className="mt-auto border-t border-border p-5">
   {p.inStock!==false&&<>
    {s.session.loading&&<p role="status">Verificando sua conta…</p>}
    {s.guest && (s.guestPrice === null ? <p>Preço indisponível neste cinema.</p> : <>
      <ProductPrice price={s.guestPrice} note="Por unidade · preço de catálogo"/>
      <p className="my-3 flex justify-between gap-3">Subtotal estimado<strong>{s.productTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></p>
      {p.eventSessionId && <p className="text-sm">Este combo acompanha ingressos da sessão vinculada.</p>}
    </>)}
    {s.session.user?.role === 'CLIENTE'&&!s.currentQuote&&<p role="status">Consultando preço…</p>}
    {s.session.user&&s.session.user.role !== 'CLIENTE'&&<p>Use uma conta de cliente para fazer um pedido.</p>}
    {s.currentQuote?.error&&<div role="alert"><p>{s.currentQuote.error}</p><Button variant="outline" onClick={s.retry}>Tentar novamente</Button></div>}
    {s.currentQuote&&!s.currentQuote.error&&<><ProductPrice price={s.currentQuote.unitPrice} originalPrice={s.currentQuote.originalPrice} discountSources={s.currentQuote.discountSources} note="Por unidade · preço para sua conta, sem cupom"/><p className="my-3 flex justify-between">Subtotal cotado<strong>{s.productTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></p>{!s.currentQuote.finalizable&&<p role="status">{s.currentQuote.catalogOutOfSync ? 'O preço precisa ser atualizado pelo cinema antes da compra.' : 'Esta cotação ainda não permite a compra. Atualize o produto e tente novamente.'}</p>}</>}
    <Button className="mt-4 w-full" disabled={!s.canAdd} onClick={s.handleAddToCart}>Adicionar ao carrinho</Button><p className="mt-3 text-xs text-muted-foreground">Adicionar não reserva estoque. O checkout confirma os valores e a disponibilidade.</p>
   </>}
  </div></>}
 </SheetContent></Sheet>;
}
