import { Minus, Plus, ShoppingBag, Ticket, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoadingImage from "@/components/ui/loading-image"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { money } from "./cart-utils"
import ProductPrice from "../astrasnack/product-price"
import styles from "./cart-layout.module.css"

export default function CartItem({ item, decrease, increase, remove }) {
  const isSession = item.purchaseKind === "SESSION"
  const price = <ProductPrice
    price={item.price}
    originalPrice={!isSession || (item.quoted && item.discountSources?.includes("TUESDAY_PROMOTION")) ? item.originalPrice : null}
    discountSources={item.discountSources}
    note={`Por unidade · ${item.quoted ? "cotado" : "estimado"}`}
  />

  if (isSession) {
    const separator = item.description?.lastIndexOf(" • ") ?? -1
    const film = separator >= 0 ? item.description.slice(0, separator) : item.description || item.name
    const cinema = separator >= 0 ? item.description.slice(separator + 3) : null
    const [, schedule = item.details, seat] = item.details?.match(/^(.*?)\s*[•·]\s*Assento:\s*(.+)$/i) ?? []
    const removeLabel = seat ? `Remover ingresso do assento ${seat}` : `Remover ingresso de ${film}`

    return (
      <article className={styles.ticket}>
        <div className={styles.ticketMain}>
          <ItemImage item={item} className={styles.poster} />
          <div className="min-w-0 self-center">
            <h2 className={"f-display " + styles.film}>{film}</h2>
            {cinema && <p className="mt-1 text-sm text-muted-foreground">{cinema}</p>}
            {schedule && <p className="mt-1 text-sm text-muted-foreground">{schedule}</p>}
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span>{item.quantity} {item.quantity === 1 ? "ingresso" : "ingressos"}</span>
              <span>· {item.name}</span>
              {seat && <strong className="text-primary">· Assento {seat}</strong>}
            </p>
          </div>
        </div>
        <div className={styles.stub}>
          <div className={styles.ticketPrice}>
            {price}
            {item.quantity > 1 && <p className="mt-1 text-sm font-bold">Total {money(item.price * item.quantity)}</p>}
          </div>
          <Dialog>
            <DialogTrigger render={
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" aria-label={removeLabel} />
            }>
              <Trash2 className="size-4" aria-hidden="true" /> Remover
            </DialogTrigger>
            <DialogContent role="alertdialog" showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Remover ingresso?</DialogTitle>
                <DialogDescription>{seat ? `O ingresso do assento ${seat} será retirado do carrinho.` : "O ingresso será retirado do carrinho."}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                <DialogClose render={<Button variant="destructive" onClick={() => remove(item)} />}>Remover ingresso</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </article>
    )
  }

  return (
    <article className={styles.product}>
      <div className="flex min-w-0 items-center gap-3">
        <ItemImage item={item} className="size-12 rounded-md" />
        <div className="min-w-0 wrap-anywhere">
          <p className="text-xs text-muted-foreground">{item.category}</p>
          <h2 className="text-sm font-bold">{item.name}</h2>
          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
          {item.details && <p className="text-xs text-muted-foreground">{item.details}</p>}
        </div>
      </div>
      <div className="text-sm">
        {price}
        {item.quantity !== 1 && <p className="mt-1 text-xs font-bold">Subtotal {money(item.price * item.quantity)}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="outline" size="icon-sm" aria-label="Diminuir quantidade" onClick={() => decrease(item)}><Minus /></Button>
        <span className="min-w-5 text-center text-sm font-bold">{item.quantity}</span>
        <Button variant="outline" size="icon-sm" disabled={item.quantity >= 100} aria-label="Aumentar quantidade" onClick={() => increase(item)}><Plus /></Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Remover ${item.name}`} onClick={() => remove(item)}><Trash2 /></Button>
      </div>
    </article>
  )
}

function ItemImage({ item, className }) {
  const Icon = item.type === "ticket" ? Ticket : ShoppingBag
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden bg-muted ${className}`}>
      {item.image
        ? <LoadingImage src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        : <Icon className="size-6 text-primary" aria-hidden="true" />}
    </div>
  )
}
