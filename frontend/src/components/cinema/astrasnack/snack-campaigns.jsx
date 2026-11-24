import { Ticket } from "lucide-react";
import ListStatus from "@/components/cinema/home/list-status";
import { useHomeContent } from "@/hooks/cinema/home/use-home-content";

export default function SnackCampaigns({ ticketPromotionBps }) {
  const banners = useHomeContent("banners", "astrasnack");
  return (
    <section id="campanhas" aria-labelledby="snack-campaigns-title" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 pb-16 pt-6 md:px-8">
      <h2 id="snack-campaigns-title" className="mb-4 border-b border-border pb-3 text-2xl font-bold">Campanhas</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {banners.items.map(item => (
          <article key={item.id} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
            {item.imageUrl && <img src={item.imageUrl} alt={item.imageAlt || ""} loading="lazy" className="size-16 shrink-0 rounded-md object-cover sm:size-24" />}
            <div className="min-w-0">
              {item.tag && <p className="text-xs text-muted-foreground">{item.tag}</p>}
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
              {item.targetUrl && <a href={item.targetUrl} className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4">{item.ctaLabel || "Ver campanha"}</a>}
            </div>
          </article>
        ))}
        {ticketPromotionBps > 0 && <article className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
          <Ticket aria-hidden="true" className="mt-1 size-6 shrink-0 text-primary" />
          <div>
            <h3 className="text-lg font-bold">Terça de Cinema</h3>
            <p className="mt-1 text-sm"><strong>Até {(ticketPromotionBps / 100).toLocaleString("pt-BR")}% de desconto no ingresso.</strong></p>
            <p className="mt-1 text-sm text-muted-foreground">Válido para compras feitas na terça-feira e sessões exibidas às terças, pelo horário de Brasília.</p>
            <a href="/cinema/filmes" className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4">Ver filmes e sessões</a>
          </div>
        </article>}
      </div>
      <ListStatus list={banners} empty={ticketPromotionBps > 0 ? "" : "Nenhuma campanha disponível no momento."} more="Ver mais campanhas" />
    </section>
  );
}
