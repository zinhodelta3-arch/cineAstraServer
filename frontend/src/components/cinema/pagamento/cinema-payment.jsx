"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import usePayment from "@/hooks/cinema/pagamento/use-payment";
import PaymentDetails from "./payment-details";
import PaymentCards from "./payment-cards";
import PaymentSummary from "./payment-summary";
import styles from "./payment.module.css";

export default function CinemaPayment() {
  const payment = usePayment();
  return <main className={styles.page}>
    <div className={styles.container}>
      <Link href="/cinema/carrinho" className={styles.back}><ArrowLeft size={16} />Voltar ao carrinho</Link>
      <header className={styles.header}><h1>Informações de <span>pagamento.</span></h1><p>Mais um passo para a sua próxima sessão.</p></header>
      <div className={styles.layout}>
        <div className={styles.detailsPanel}>
          <form id="payment-details-form" onSubmit={payment.confirm}><PaymentDetails details={payment.details} onChange={payment.changeDetail} /></form>
          <PaymentCards cards={payment.cards} selectedCard={payment.selectedCard} onSelect={payment.setSelectedCard} open={payment.cardOpen} onOpenChange={payment.changeCardOpen} onAdd={payment.addCard} error={payment.cardError} />
        </div>
        <PaymentSummary items={payment.items} itemCount={payment.itemCount} total={payment.total} error={payment.error} />
      </div>
    </div>
    <Dialog open={payment.confirmed} onOpenChange={payment.setConfirmed}>
      <DialogContent className="sm:max-w-md"><CheckCircle2 className="size-9 text-primary" /><DialogHeader><DialogTitle>Pedido revisado!</DialogTitle><DialogDescription>Você concluiu a simulação. Nenhum pagamento foi processado e seus itens continuam no carrinho.</DialogDescription></DialogHeader><DialogClose render={<Button />}>Entendido</DialogClose></DialogContent>
    </Dialog>
  </main>;
}
