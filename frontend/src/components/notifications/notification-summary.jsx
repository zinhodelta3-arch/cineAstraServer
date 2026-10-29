import styles from "./notifications.module.css";
import { Bell, Clapperboard } from "lucide-react";
import Barcode from "./barcode";

export default function NotificationSummary({ ready, unreadCount }) {
  return (
          <aside className={styles.sidebar} aria-label="Resumo das notificações">
            <div className={styles.summaryTicket}>
              <div className={styles.ticketTop}><Clapperboard size={24} strokeWidth={1.4} aria-hidden="true" /><span>SEU CINEMA, EM DIA.</span></div>
              <div className={styles.ticketMiddle}><span className={styles.summaryNumber}>{ready ? unreadCount.toString().padStart(2, "0") : "–"}</span><p>{unreadCount === 1 ? "não lida\nentre as carregadas" : "não lidas\nentre as carregadas"}</p></div>
              <div className={styles.ticketTear} aria-hidden="true" />
              <div className={styles.ticketBottom}><p>{unreadCount ? "Tem novidade esperando por você. Sua próxima cena começa aqui." : "Nenhum aviso não lido entre os itens carregados."}</p><Barcode /><span>ACESSO PESSOAL · CINEASTRA</span></div>
            </div>
            <p className={styles.sidebarNote}><Bell size={15} aria-hidden="true" />Avisos da sua conta. Carregue mais notificações para consultar o restante.</p>
          </aside>
  );
}
