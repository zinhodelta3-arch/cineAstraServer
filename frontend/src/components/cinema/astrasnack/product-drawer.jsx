"use client";
import Link from 'next/link';
import {Minus,Plus,Popcorn} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle} from '@/components/ui/sheet';
import ListStatus from '@/components/cinema/home/list-status';
import {publicAsset} from '@/lib/api/public-api.mjs';
export default function ProductDrawer({snack:s}){
 const p=s.selectedProduct;
 return <Sheet open={s.drawerOpen} onOpenChange={s.setDrawerOpen}><SheetContent side="right" className="z-[80] !w-[min(28rem,100vw)] gap-0 overflow-y-auto p-0">
  <SheetHeader className="border-b border-border p-5 pr-14"><SheetTitle className="text-2xl font-bold">{p?.name||s.selected?.name||'Produto'}</SheetTitle><SheetDescription>{p?.category||'Detalhes do produto'}</SheetDescription></SheetHeader>
  {s.loadingDetail&&<p role="status" className="p-5">Carregando produto…</p>}{s.detailError&&<div role="alert" className="p-5"><p>{s.detailError}</p><Button onClick={s.retry}>Tentar novamente</Button></div>}
  {p&&<><div className="p-5"><div className="flex aspect-video items-center justify-center rounded-lg bg-muted">{p.image?<img src={p.image} alt={p.name} className="h-full w-full object-contain"/>:<Popcorn className="size-16 text-muted-foreground"/>}</div><p className="my-5 text-sm">{p.description||'Descrição não informada.'}</p>
   {p.items.length>0&&<ul className="mb-4 text-sm">{p.items.map(i=><li key={i.id_insumo}>{i.quantidade} × {i.nome}</li>)}</ul>}
   <div className="grid grid-cols-2 gap-2">{s.gallery.items.map(i=>publicAsset(i.url)&&<img key={i.id_imagem} src={publicAsset(i.url)} alt={i.texto_alternativo||p.name} className="w-full rounded-md"/>)}</div><ListStatus list={s.gallery} empty="" more="Mais imagens"/>
   <p className="text-sm">{p.inStock===false?'Indisponível no momento':p.inStock===true?'Disponível no catálogo':'Disponibilidade confirmada no checkout'}</p>
   <div className="my-5 flex items-center justify-between"><span>Quantidade</span><div className="flex items-center gap-4"><Button aria-label="Diminuir quantidade" variant="outline" size="icon" disabled={s.quantity<=1} onClick={s.decreaseQuantity}><Minus/></Button><span aria-live="polite">{s.quantity}</span><Button aria-label="Aumentar quantidade" variant="outline" size="icon" disabled={s.quantity>=100} onClick={s.increaseQuantity}><Plus/></Button></div></div>
  </div><div className="mt-auto border-t border-border p-5">
   {!s.session.user?<Link href="/auth/login" className="font-semibold text-primary underline">Entrar para cotar e adicionar ao carrinho</Link>:p.inStock!==false?<>
    {!s.currentQuote&&<p role="status">Consultando preço…</p>}
    {s.currentQuote?.error&&<div role="alert"><p>{s.currentQuote.error}</p><Button variant="outline" onClick={s.retry}>Tentar novamente</Button></div>}
    {s.currentQuote&&!s.currentQuote.error&&<><p className="mb-2 flex justify-between">Subtotal cotado<strong>{s.productTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></p>{!s.currentQuote.finalizable&&<p role="status">O preço precisa ser atualizado pelo cinema antes da compra.</p>}</>}
    <Button className="mt-4 w-full" disabled={!s.canAdd} onClick={s.handleAddToCart}>Adicionar ao carrinho</Button><p className="mt-3 text-xs text-muted-foreground">Adicionar não reserva estoque. O checkout confirma os valores e a disponibilidade.</p>
   </>:null}
  </div></>}
 </SheetContent></Sheet>;
}
