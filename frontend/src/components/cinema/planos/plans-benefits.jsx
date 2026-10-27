import { CreditCard, Gift, ShieldCheck } from "lucide-react"

export default function PlansBenefits() {
  return (
      <section className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
          <div><div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Transparência em primeiro lugar</div><h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Você no controle<span className="text-primary">.</span></h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Gerencie sua assinatura e escolha a forma de pagamento com clareza.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-card/60 p-5"><CreditCard className="size-5 text-primary" /><h3 className="mt-3 font-bold">Formas de pagamento</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Cartão de crédito, débito automático e Pix Automático, conforme disponibilidade do provedor de pagamento.</p></div>
            <div className="rounded-xl border border-border/70 bg-card/60 p-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-3 font-bold">Cancelamento pelo sistema</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">O titular poderá cancelar a assinatura e os participantes poderão sair do plano sem cancelar para os demais.</p></div>
            <div className="rounded-xl border border-border/70 bg-card/60 p-5"><Gift className="size-5 text-primary" /><h3 className="mt-3 font-bold">Benefícios por ciclo</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Ingressos, combos e cupons têm limites mensais e regras de uso específicas para cada plano.</p></div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-3 font-bold">7 dias para se arrepender</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Após a contratação, você terá 7 dias para exercer o direito de arrependimento e receber o reembolso integral do valor pago, conforme a legislação aplicável.</p></div>
          </div>
        </div>
      </section>
  )
}
