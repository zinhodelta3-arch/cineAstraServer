import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import styles from "./payment.module.css";

export default function PaymentCardDialog({ onSubmit, error }) {
  return <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
    <DialogHeader><DialogTitle>Adicionar cartão de exemplo</DialogTitle><DialogDescription>Use dados fictícios. Não pedimos o número completo nem o código de segurança.</DialogDescription></DialogHeader>
    <form onSubmit={onSubmit} className={styles.cardForm}>
      <label className={styles.field}><span>Apelido</span><input name="nickname" maxLength={35} placeholder="Meu cartão" /></label>
      <label className={styles.field}><span>Bandeira</span><select name="brand"><option>Visa</option><option>Mastercard</option><option>Elo</option><option>American Express</option></select></label>
      <div className={styles.fields}>
        <label className={styles.field}><span>Últimos 4 dígitos</span><input name="last4" inputMode="numeric" required pattern="[0-9]{4}" maxLength={4} placeholder="1234" /></label>
        <label className={styles.field}><span>Validade</span><input name="expiry" required pattern="(0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} placeholder="MM/AA" /></label>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.dialogActions}><DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose><Button type="submit">Salvar cartão</Button></div>
    </form>
  </DialogContent>;
}
