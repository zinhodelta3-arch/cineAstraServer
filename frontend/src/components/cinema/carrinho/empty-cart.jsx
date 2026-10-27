import { ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmptyCart({  }) {
  return (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
            <div className="max-w-sm"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><ShoppingBag className="size-7" /></div><h2 className="text-xl font-black">Ainda não há itens por aqui</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Adicione produtos do AstraSnack ao seu pedido. O carrinho também está preparado para receber ingressos.</p><Button nativeButton={false} render={<Link href="/cinema/astrasnack" />} className="mt-5">Explorar AstraSnack <ArrowRight className="size-4" /></Button></div>
          </section>
  )
}
