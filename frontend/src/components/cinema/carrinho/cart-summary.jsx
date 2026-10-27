import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { money } from "./cart-utils"

export default function CartSummary({ itemCount, total, checkout }) {
  return (
            <aside className="h-fit rounded-2xl border border-border/70 bg-card/60 p-5 lg:sticky lg:top-24">
              <div className="mb-4 text-[10px] font-bold tracking-[.2em] text-primary uppercase">Resumo do pedido</div><h2 className="text-xl font-black">Sua sessão, do seu jeito.</h2>
              <div className="my-5 space-y-3 border-y border-dashed border-border py-4 text-sm"><div className="flex justify-between text-muted-foreground"><span>Quantidade de itens</span><span>{itemCount}</span></div><div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(total)}</span></div><div className="flex justify-between text-muted-foreground"><span>Taxas</span><span>A calcular</span></div><div className="flex justify-between pt-1 text-base font-black"><span>Total parcial</span><span>{money(total)}</span></div></div>
              <Button className="w-full" size="lg" onClick={checkout}><span>Finalizar compra</span><ArrowRight className="size-4" /></Button>
              <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">Confira os itens antes de prosseguir para a próxima etapa.</p>
              <Button nativeButton={false} render={<Link href="/cinema/astrasnack" />} variant="outline" className="mt-3 w-full">Continuar comprando</Button>
            </aside>
  )
}
