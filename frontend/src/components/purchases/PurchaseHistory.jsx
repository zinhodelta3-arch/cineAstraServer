"use client";
import Link from 'next/link';
import {useSession} from '@/hooks/auth/use-session';
import usePurchaseHistory from '@/hooks/cinema/minhascompras/use-purchase-history';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import ListStatus from '@/components/cinema/home/list-status';
import {orderStatuses,purchaseDate,purchaseMoney} from '@/lib/api/purchases.mjs';
import PurchaseIcon from './purchase-icon';
import Perforation from './perforation';
import OrderDetails from './order-details';
import './purchases.css';
function History(){
 const s=usePurchaseHistory();
 return <>
  <section className="cp-history" aria-labelledby="cp-history-heading">
   <div className="cp-history-heading"><h2 id="cp-history-heading"><PurchaseIcon name="archive" />Histórico de pedidos</h2><Button variant="outline" disabled={s.list.loading} onClick={s.list.retry}>Atualizar pedidos</Button></div>
   <div className="my-6 grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Buscar número do pedido<Input className="mt-2" value={s.query} onChange={e=>s.setQuery(e.target.value)} inputMode="numeric" /></label>
    <label className="text-sm">Estado do pedido<select aria-label="Estado do pedido" value={s.status} onChange={e=>s.setStatus(e.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-card p-3"><option value="all">Todos</option>{Object.entries(orderStatuses).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   </div>
   <p className="mb-4 text-xs text-muted-foreground">{s.matching.length} de {s.list.items.length} pedidos carregados · filtros aplicados aos itens carregados.</p>
   <ul className="space-y-4">{s.matching.map(order=><li key={order.orderId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
    <div><h3 className="text-lg font-bold">Pedido #{order.orderId}</h3><p className="mt-1 text-sm text-muted-foreground">{purchaseDate(order.createdAt)} (Brasília)</p><p className="mt-2 text-sm font-semibold text-primary">{orderStatuses[order.financialStatus]||order.financialStatus}</p></div>
    <div className="flex flex-wrap items-center gap-4"><p className="font-bold">{purchaseMoney(order.total)}</p><Button variant="outline" onClick={()=>s.setSelection(order)}>Ver pedido #{order.orderId}</Button></div>
   </li>)}</ul>
   {!s.list.loading&&!s.list.error&&s.list.items.length>0&&!s.matching.length&&<p>Nenhum pedido carregado corresponde aos filtros.</p>}
   <ListStatus list={s.list} empty="Você ainda não possui pedidos." more="Carregar mais pedidos" />
  </section>
  {s.selection&&<OrderDetails key={s.selection.orderId} order={s.selection} onClose={()=>s.setSelection(null)} onChanged={s.list.retry} />}
 </>;
}
export default function PurchaseHistory(){
 const session=useSession();
 return <main className="cp-root cp-page"><div className="cp-grain" aria-hidden="true" /><div className="cp-container">
  <nav className="cp-breadcrumb" aria-label="Você está em"><Link href="/cinema/perfil">Minha conta</Link><PurchaseIcon name="chevron" /><span aria-current="page">Minhas compras</span></nav>
  <header className="cp-page-heading"><div><p className="cp-eyebrow"><PurchaseIcon name="film" />O SEU ARQUIVO DE BOAS HISTÓRIAS</p><h1>Minhas <em>compras.</em></h1><p className="cp-page-description">Acompanhe seus pedidos, ingressos e contratos.</p></div></header>
  {session.loading?<p role="status">Verificando sua conta…</p>:session.user?.role==='CLIENTE'?<History key={session.user.id} />:<section className="rounded-xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Compras da sua conta</h2><p className="my-4">{session.user?'Esta área é destinada às contas de cliente.':'Entre para consultar suas compras.'}</p>{!session.user&&<Link href="/auth/login" className="text-primary underline">Entrar para ver minhas compras</Link>}</section>}
  <footer className="cp-page-footer"><span>CINEASTRA <b>✦</b> ALÉM DA TELA</span><Perforation /><span>SEU ARQUIVO. SUAS HISTÓRIAS.</span></footer>
 </div></main>;
}
