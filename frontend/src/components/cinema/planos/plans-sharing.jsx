import { ArrowRight, CheckCircle2, Heart, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLANS } from "./data"

export default function PlansSharing({ shareOpen, toggleSharing, inviteSent, resetInvite, submitInvite, sharePlan, changeSharePlan, inviteContact, changeInviteContact, paymentSplit, setPaymentSplit }) {
  return (
      <section id="compartilhar" className="scroll-mt-24 border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><Users className="size-4" /> Compartilhe a experiência</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Cinema bom é cinema compartilhado<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Convide pessoas para participar do plano. O titular escolhe como o valor será pago; a composição e as cotas podem ser ajustadas no próximo ciclo de cobrança.</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Wallet className="size-4" /></div><div><div className="text-sm font-bold">Pagador único</div><p className="text-xs leading-5 text-muted-foreground">O titular paga o valor total da assinatura.</p></div></div>
              <div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Users className="size-4" /></div><div><div className="text-sm font-bold">Divisão igual</div><p className="text-xs leading-5 text-muted-foreground">O valor é dividido igualmente entre os participantes incluídos, conforme as regras do plano.</p></div></div>
            </div>
            <Button className="mt-6" onClick={toggleSharing}>{shareOpen ? "Fechar convite" : "Simular convite de participante"} <ArrowRight className="size-4" /></Button>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
            {shareOpen ? (
              inviteSent ? (
                <div className="py-8 text-center"><CheckCircle2 className="mx-auto size-10 text-primary" /><h3 className="f-display mt-3 text-3xl font-black">Convite preparado!</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Esta é uma demonstração. Nenhum convite foi enviado e nenhum participante foi adicionado ao plano.</p><Button variant="outline" className="mt-4" onClick={resetInvite}>Criar outro convite</Button></div>
              ) : (
                <form onSubmit={submitInvite} className="space-y-4">
                  <div><div className="text-[10px] font-black tracking-[.2em] text-primary uppercase">Convite demonstrativo</div><h3 className="f-display mt-1 text-3xl font-black">Traga sua turma.</h3><p className="mt-2 text-sm text-muted-foreground">Selecione um plano, informe o contato e escolha a forma de divisão.</p></div>
                  <label className="grid gap-1.5 text-xs font-semibold">Plano
                    <select value={sharePlan} onChange={changeSharePlan} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal">{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold">E-mail ou contato do participante
                    <input required value={inviteContact} onChange={changeInviteContact} placeholder="contato@exemplo.com" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <fieldset className="grid gap-2"><legend className="mb-1 text-xs font-semibold">Modalidade de pagamento</legend>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentSplit === "titular" ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="split" value="titular" checked={paymentSplit === "titular"} onChange={() => setPaymentSplit("titular")} className="mt-1 accent-[hsl(var(--primary))]" /><span><span className="block text-sm font-bold">Pagador único</span><span className="text-xs text-muted-foreground">Titular paga o valor total.</span></span></label>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentSplit === "dividido" ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="split" value="dividido" checked={paymentSplit === "dividido"} onChange={() => setPaymentSplit("dividido")} className="mt-1 accent-[hsl(var(--primary))]" /><span><span className="block text-sm font-bold">Divisão igual</span><span className="text-xs text-muted-foreground">Cotas iguais a partir do próximo ciclo.</span></span></label>
                  </fieldset>
                  <Button type="submit" className="w-full">Preparar convite <Users className="size-4" /></Button>
                  <p className="text-center text-[10px] leading-5 text-muted-foreground">A inclusão real depende de assinatura ativa, aceite dentro do prazo e notificações implementadas.</p>
                </form>
              )
            ) : (
              <div className="p-2 sm:p-4">
                <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-black tracking-[.2em] text-primary uppercase">Plano em grupo</div><h3 className="f-display mt-1 text-3xl font-black">Sua sessão, sua turma.</h3></div><div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Heart className="size-6" /></div></div>
                <div className="space-y-3">
                  {[[ "Titular", "Você escolhe o plano e gerencia a assinatura." ], [ "Convite", "Envie um convite para o contato do participante." ], [ "Aceite", "A pessoa aceita dentro do prazo de validade." ], [ "Pagamento", "Escolha pagador único ou divisão igual." ], [ "Próximo ciclo", "Cotas atualizadas e participantes notificados." ]].map(([title, text], i) => <div key={title} className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-black text-primary">{i + 1}</div><div className="pb-2"><div className="text-sm font-bold">{title}</div><p className="text-xs leading-5 text-muted-foreground">{text}</p></div></div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
  )
}
