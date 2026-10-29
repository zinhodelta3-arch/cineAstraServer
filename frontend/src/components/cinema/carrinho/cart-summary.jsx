import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {money} from './cart-utils';
export default function CartSummary({itemCount,total,quote,pending,error,issue,session,coupon,setCoupon,calculate}){
 return <aside className="h-fit rounded-2xl border border-border/70 bg-card/60 p-5 lg:sticky lg:top-24">
  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Resumo do pedido</p><h2 className="text-xl font-black">Confira seu carrinho.</h2>
  <div className="my-5 space-y-3 border-y border-dashed border-border py-4 text-sm">
   <div className="flex justify-between"><span>Quantidade</span><span>{itemCount}</span></div>
   <div className="flex justify-between"><span>{quote?'Total cotado':'Estimativa local'}</span><strong>{money(total)}</strong></div>
   <div className="flex justify-between"><span>Taxas</span><span>{quote?money(Number(quote.fees)):'A consultar'}</span></div>
  </div>
  <label className="block text-sm">Cupom (opcional)<Input className="mt-2" value={coupon} onChange={e=>setCoupon(e.target.value)} maxLength={50} autoComplete="off" /></label>
  {issue&&<p role="alert" className="mt-4 text-sm">{issue}</p>}
  {error&&<p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  {session.loading?<p role="status" className="mt-4">Verificando sua conta…</p>:!session.user?<Link className="mt-4 block text-primary underline" href="/auth/login">Entrar para consultar preço e estoque</Link>:session.user.role!=='CLIENTE'?<p className="mt-4 text-sm">Use uma conta de cliente para consultar o pedido.</p>:<Button className="mt-4 w-full" onClick={calculate} disabled={pending||Boolean(issue)}>{pending?'Consultando…':quote?'Atualizar cotação':'Consultar preço e estoque'}</Button>}
  {quote&&<p role="status" className="mt-4 text-sm">{quote.guardianAuthorizationRequired?'Esta compra precisa de autorização do responsável.':quote.finalizable?'Cotação recebida. Os produtos ainda não estão reservados.':'A API não autorizou a finalização desta cotação.'}</p>}
  <p className="mt-4 text-xs leading-5 text-muted-foreground">Alterar itens ou cupom exige nova cotação. A criação do pedido e o pagamento serão integrados na próxima etapa.</p>
  <Button nativeButton={false} render={<Link href="/cinema/astrasnack" />} variant="outline" className="mt-4 w-full">Continuar comprando</Button>
 </aside>;
}
