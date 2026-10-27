"use client";

import { CalendarDays, Plus, Minus, X } from "lucide-react";
import { formatBRL } from "./data";
import { Barcode, Badge, Button } from "./home-ui";
import { useTicketBooking } from "@/hooks/cinema/home/use-ticket-booking";

export default function TicketBookingModal({ movie, onClose, onAddToCart }) {
  const { sessions, date, setDate, session, setSession, count, setCount, type, setType, totalValue, confirm } = useTicketBooking(movie, onClose, onAddToCart);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Comprar ingresso de ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ticket w-full max-w-3xl grid md:grid-cols-[1fr_220px] bg-card border border-border rounded-xl shadow-2xl" style={{ "--n": "50%" }}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-primary/10 text-primary border border-primary/30">Compra rápida</Badge>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground md:hidden"><X className="w-5 h-5" /></button>
          </div>
          <h3 className="f-display text-4xl md:text-5xl font-black text-card-foreground mb-6 leading-none">{movie.title}</h3>

          <div className="space-y-5">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-2">Data</span>
              <div className="flex gap-2 flex-wrap">
                {["Hoje", "Amanhã", "Sáb, 28 Set"].map((d) => (
                  <Button key={d} size="sm" variant={date === d ? "wine" : "outline"} onClick={() => setDate(d)}>
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />{d}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-2">Horário da sessão</span>
              <div className="flex gap-2 flex-wrap">
                {sessions.map((s) => (
                  <Button key={s} size="sm" variant={session === s ? "default" : "outline"} onClick={() => setSession(s)}>{s}</Button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-2">Tipo de entrada</span>
                <div className="flex gap-2">
                  <Button size="sm" variant={type === "inteira" ? "wine" : "outline"} onClick={() => setType("inteira")} className="flex-1">Inteira R$ 38</Button>
                  <Button size="sm" variant={type === "meia" ? "wine" : "outline"} onClick={() => setType("meia")} className="flex-1">Meia R$ 19</Button>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-2">Quantidade</span>
                <div className="flex items-center justify-between border border-border rounded-full p-1 bg-muted/30">
                  <Button size="icon" variant="ghost" aria-label="Menos" onClick={() => setCount((p) => Math.max(1, p - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="font-bold text-primary" aria-live="polite">{count}</span>
                  <Button size="icon" variant="ghost" aria-label="Mais" onClick={() => setCount((p) => p + 1)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tear tear-v md:border-t-0 bg-secondary/15 p-6 flex flex-col justify-between gap-6">
          <button type="button" onClick={onClose} aria-label="Fechar" className="self-end p-1 text-muted-foreground hover:text-foreground hidden md:block"><X className="w-5 h-5" /></button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">{date} · {session}</p>
            <p>{count}x {type}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total do pedido</span>
            <span className="f-display text-5xl font-black text-primary">{formatBRL(totalValue)}</span>
          </div>
          <Barcode seed={movie.title.length} />
          <Button onClick={confirm} className="w-full">Adicionar ao pedido</Button>
        </div>
      </div>
    </div>
  );
}
