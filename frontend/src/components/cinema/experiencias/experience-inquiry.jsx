import { ArrowUpRight, CalendarDays, CheckCircle2, MapPin, MessageCircle, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ExperienceInquiry({ selectedExperience, sent, submitInquiry, resetInquiry, changeExperience, minimumDate, experiences, form, update, pending, message, detailLoading, detailError, retryDetail, experience, session }) {
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
                <h4 className="mt-3 text-lg font-black">Solicitação enviada</h4>
                <p className="mt-2 text-sm text-muted-foreground">Chamado #{sent.id}. A equipe responderá pelo suporte.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button nativeButton={false} render={<Link href="/cinema/suporte" />}>Acompanhar no suporte</Button>
                  <Button type="button" variant="outline" onClick={resetInquiry}>Enviar outra solicitação</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:col-span-2">Experiência desejada
                    <select required disabled={pending || !experiences.length} value={selectedExperience} onChange={changeExperience} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15">
                      <option value="">Selecione uma experiência</option>{experiences.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Data desejada
                    <input type="date" name="date" required disabled={pending} value={form.date} onChange={update("date")} min={minimumDate} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">{experience?.location ? "Quantidade de pessoas" : "Quantidade de pessoas/veículos"}
                    <input type="number" name="guests" required disabled={pending} value={form.guests} onChange={update("guests")} min="1" max={experience?.location?.eventCapacity ?? 100000} placeholder="Ex.: 40" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:col-span-2">Conte mais sobre seu evento
                    <textarea name="details" required disabled={pending} value={form.details} onChange={update("details")} minLength={10} maxLength={4000} rows={4} placeholder="Tipo de evento, cidade/local, duração e o que você imagina..." className="resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                </div>
                {detailLoading && <p className="mt-3 text-sm" role="status">Consultando a experiência…</p>}
                {detailError && <div className="mt-3"><p role="alert">{detailError}</p><Button type="button" variant="outline" onClick={retryDetail}>Tentar novamente</Button></div>}
                {message && <p className="mt-3 text-sm text-destructive" role="alert">{message}</p>}
                {session.loading ? <p className="mt-4 text-sm" role="status">Consultando sua conta…</p> : session.user?.role === "CLIENTE" ? (
                  <Button type="submit" size="lg" disabled={pending || !experience} className="mt-5 w-full">{pending ? "Enviando…" : "Solicitar orçamento"} <ArrowUpRight className="size-4" /></Button>
                ) : session.user ? <p className="mt-4 text-sm">Use uma conta de cliente para enviar a solicitação.</p> :
                  <Button nativeButton={false} render={<Link href="/auth/login" />} className="mt-5 w-full">Entrar para solicitar orçamento</Button>}
              </>
            )}
          </form>
        </div>
      </section>
  )
}
