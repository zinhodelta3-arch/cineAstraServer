import { Check, CreditCard, Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import PaymentCardDialog from "./payment-card-dialog";
import styles from "./payment.module.css";

export default function PaymentCards({ cards, selectedCard, onSelect, open, onOpenChange, onAdd, error }) {
  return <section className={styles.wallet} aria-labelledby="payment-cards-title">
    <h2 id="payment-cards-title" className={styles.sectionTitle}>Seus cartões salvos</h2>
    <p className={styles.hint}>Cartões demonstrativos. Escolha um para testar o pagamento.</p>
    <div className={styles.cards}>
      {cards.map((card) => <button key={card.id} type="button" aria-pressed={selectedCard === card.id} aria-label={`${card.brand} final ${card.last4}`} onClick={() => onSelect(card.id)} className={`${styles.bankCard} ${selectedCard === card.id ? styles.selectedCard : ""}`}>
        <span className={styles.cardTop}><CreditCard size={23} /><strong>{card.brand}</strong><span className={styles.check}>{selectedCard === card.id && <Check size={14} />}</span></span>
        <span className={styles.cardNumber}>•••• •••• •••• {card.last4}</span>
        <span className={styles.cardBottom}><span>{card.nickname}</span><span>{card.expiry}</span></span>
      </button>)}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger className={styles.addCard}><Plus size={24} /><span>Adicionar cartão</span><small>Apenas dados de exemplo</small></DialogTrigger>
        <PaymentCardDialog onSubmit={onAdd} error={error} />
      </Dialog>
    </div>
  </section>;
}
