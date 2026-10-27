import styles from "./notifications.module.css";
import { CheckCheck } from "lucide-react";

export default function NotificationToolbar({ items, ready, unreadCount, read, filter, setFilter, readAll }) {
  return (
            <div className={styles.toolbar}>
              <div className={styles.filters} role="group" aria-label="Filtrar notificações">{[{ id: "all", label: "Todas", count: items.length }, { id: "unread", label: "Não lidas", count: unreadCount }, { id: "read", label: "Lidas", count: read.length }].map((tab) => <button type="button" key={tab.id} onClick={() => setFilter(tab.id)} aria-pressed={filter === tab.id} className={filter === tab.id ? styles.activeFilter : ""}>{tab.label}<span>{ready ? tab.count : "–"}</span></button>)}</div>
              <button type="button" className={styles.markAll} disabled={!ready || !unreadCount} onClick={readAll}><CheckCheck size={17} aria-hidden="true" /><span>Marcar todas como lidas</span></button>
            </div>
  );
}
