import { ArrowRight, Clapperboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PlansSubscription({ checkoutNotice, selectedPlanName, compareAgain }) {
  return (
      <section id="assinar" className="scroll-mt-24 mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Clapperboard className="size-6" /></div><div><h2 className="f-display text-3xl font-black">Pronto para fazer parte?</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{checkoutNotice ? `Você escolheu o plano ${selectedPlanName}. A contratação real será habilitada quando o fluxo de pagamento estiver integrado.` : "Escolha seu plano e tenha mais motivos para viver o cinema."}</p></div></div>
          <div className="flex flex-wrap gap-2"><Button onClick={compareAgain} variant="outline">Comparar novamente</Button><Button nativeButton={false} render={<Link href="/cadastro" />}>Criar conta <ArrowRight className="size-4" /></Button></div>
        </div>
      </section>
  )
}
