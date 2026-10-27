import styles from "./notifications.module.css";
import { ArrowRight, Bell, Check, MessageCircle, Ticket, Trash2 } from "lucide-react";
import { dateFormatter, fullDateFormatter } from "./notification-formatters";

export default function NotificationCard({ item, onOpen, onToggle, onRemove }) {
  const Icon = item.type === "support" ? MessageCircle : Ticket;
  return <article className={`${styles.notification} ${!item.read ? styles.unread : ""}`} aria-label={`${item.label}: ${item.subject}${!item.read ? ", não lida" : ""}`}>
    <div className={styles.iconStub}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /><span>{item.type === "ticket" ? "TICKET" : "CONTATO"}</span></div>
    <div className={styles.cardBody}>
      <div className={styles.cardMeta}><span>{item.label}</span><span className={styles.dot} aria-hidden="true" /><time dateTime={item.createdAt} title={fullDateFormatter.format(new Date(item.createdAt))}>{dateFormatter.format(new Date(item.createdAt))}</time>{!item.read && <span className={styles.newBadge}>Nova</span>}</div>
      <h3>{item.title}</h3><p>{item.description}</p>
      <div className={styles.cardActions}>
        <button type="button" className={styles.detailsButton} onClick={() => onOpen(item)}>Ver detalhes <ArrowRight size={15} aria-hidden="true" /></button>
        <div className={styles.secondaryActions}>
          <button type="button" onClick={() => onToggle(item)} aria-label={`Marcar ${item.subject} como ${item.read ? "não lida" : "lida"}`} title={item.read ? "Marcar como não lida" : "Marcar como lida"}>{item.read ? <Bell size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}<span>{item.read ? "Marcar não lida" : "Marcar como lida"}</span></button>
          <button type="button" onClick={() => onRemove(item)} aria-label={`Excluir notificação: ${item.subject}`} title="Excluir notificação"><Trash2 size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  </article>;
}
