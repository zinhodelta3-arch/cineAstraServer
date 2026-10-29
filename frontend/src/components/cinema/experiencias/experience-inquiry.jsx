import { ArrowUpRight, CalendarDays, CheckCircle2, MapPin, MessageCircle, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EXPERIENCES } from "./data"

export default function ExperienceInquiry({ selectedExperience, sent, submitInquiry, resetInquiry, changeExperience, minimumDate }) {
  return (
      <section id="reservar" className="scroll-mt-24 border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><CalendarDays className="size-4" /> Vamos conversar</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Sua próxima<br />história começa aqui<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Conte um pouco sobre o evento. Nossa equipe poderá entender suas necessidades e preparar uma proposta personalizada.</p>
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-4 text-primary" /><div><div className="text-sm font-bold">Data e duração</div><p className="text-xs text-muted-foreground">Informe a data desejada e o tempo estimado.</p></div></div>
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-primary" /><div><div className="text-sm font-bold">Local e estrutura</div><p className="text-xs text-muted-foreground">Para eventos externos, a disponibilidade depende do local e da infraestrutura.</p></div></div>
              <div className="flex items-start gap-3"><MessageCircle className="mt-0.5 size-4 text-primary" /><div><div className="text-sm font-bold">Proposta sob medida</div><p className="text-xs text-muted-foreground">Os valores exibidos são iniciais e precisam de confirmação pela equipe.</p></div></div>
            </div>
          </div>

          <form onSubmit={submitInquiry} className="rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-dashed border-border pb-5">
              <div><div className="text-[10px] font-black tracking-[.22em] text-primary uppercase">Pedido de informações</div><h3 className="f-display mt-1 text-3xl font-black">Conte pra gente.</h3></div>
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><PartyPopper className="size-6" /></div>
            </div>
            {sent ? (
              <div role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-6 text-center">
                <CheckCircle2 className="mx-auto size-9 text-primary" />
                <h4 className="mt-3 text-lg font-black">Solicitação preparada!</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Esta é uma demonstração de interface: os dados não foram enviados a uma equipe nem geraram uma reserva real.</p>
                <Button type="button" variant="outline" className="mt-4" onClick={resetInquiry}>Enviar outra solicitação</Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Nome
                    <input required name="name" placeholder="Como podemos te chamar?" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">E-mail ou telefone
                    <input required name="contact" placeholder="Seu melhor contato" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:col-span-2">Experiência desejada
                    <select value={selectedExperience} onChange={changeExperience} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15">
                      {EXPERIENCES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Data desejada
                    <input type="date" name="date" min={minimumDate} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Quantidade de pessoas/veículos
                    <input type="number" name="guests" min="1" placeholder="Ex.: 40" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:col-span-2">Conte mais sobre seu evento
                    <textarea name="details" rows={4} placeholder="Tipo de evento, cidade/local, duração e o que você imagina..." className="resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                </div>
                <Button type="submit" size="lg" className="mt-5 w-full">Solicitar informações <ArrowUpRight className="size-4" /></Button>
                <p className="mt-3 text-center text-[10px] leading-5 text-muted-foreground">Preenchimento demonstrativo. A integração de envio e a confirmação de reservas serão implementadas posteriormente.</p>
              </>
            )}
          </form>
        </div>
      </section>
  )
}
