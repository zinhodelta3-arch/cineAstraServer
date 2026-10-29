import { Minus, Plus, ShoppingBag, Ticket, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { money } from "./cart-utils"

export default function CartItem({ item, decrease, increase, remove }) {
  return (
                <article className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/40 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                    {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : item.type === "ticket" ? <Ticket className="size-8 text-primary" /> : <ShoppingBag className="size-8 text-primary/60" />}
                  </div>
                  <div className="min-w-0 flex-1"><div className="text-[10px] font-bold tracking-[.18em] text-primary uppercase">{item.category}</div><h2 className="mt-1 text-lg font-bold">{item.name}</h2>{item.description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>}{item.details && <p className="mt-1 text-xs text-muted-foreground">{item.details}</p>}<p className="mt-2 text-sm font-semibold">{money(item.price)} <span className="font-normal text-muted-foreground">/ unidade · {item.quoted ? "cotado" : "estimado"}</span></p></div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><div className="flex items-center gap-1 rounded-full border border-border p-1"><Button variant="ghost" size="icon-sm" aria-label="Diminuir quantidade" onClick={() => decrease(item)}><Minus /></Button><span className="w-6 text-center text-sm font-bold">{item.quantity}</span><Button variant="ghost" size="icon-sm" disabled={item.quantity >= 100} aria-label="Aumentar quantidade" onClick={() => increase(item)}><Plus /></Button></div><strong className="text-lg font-black">{money(item.price * item.quantity)}</strong><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => remove(item)}><Trash2 className="size-4" /> Remover</Button></div>
                </article>
  )
}
