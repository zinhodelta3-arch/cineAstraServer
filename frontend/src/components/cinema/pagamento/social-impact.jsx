import Link from "next/link";
import { Leaf } from "lucide-react";

const money = value => Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export default function SocialImpact({ destination, confirmed = false, showEmpty = false }) {
  if (!destination || Number(destination.amount) <= 0) {
    return showEmpty && <p className="mt-3 text-sm text-muted-foreground">{confirmed ? "Nenhum valor de destinação social está registrado para este pedido." : "Não há valor de destinação social previsto para este pedido."}</p>;
  }
  return <section aria-label="Destinação social do pedido" className="mt-4 flex gap-3 rounded-lg border border-emerald-300 bg-emerald-950 p-3 text-sm text-emerald-50">
    <Leaf size={20} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
    <div className="min-w-0 space-y-1">
      <p className="font-semibold">{confirmed ? "Destinação registrada" : "Destinação estimada"}{destination.simulated ? " · Simulação" : ""}</p>
      <p className="break-words">{money(destination.amount)} para <strong>{destination.institution}</strong>. Valor custeado pelo CineAstra, sem acréscimo ao total.</p>
      {!confirmed && <p>O valor é calculado na confirmação do pagamento.</p>}
      <Link className="inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href="/cinema/destinacao-social">Consultar iniciativa</Link>
    </div>
  </section>;
}
