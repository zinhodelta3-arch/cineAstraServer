import styles from "./notifications.module.css";
import NotificationCard from "./notification-card";

export default function NotificationGroup({ title, entries, isNew, openDetails, toggleRead, deleteItem }) {
    if (!entries.length) return null;
    return <section className={styles.group} aria-label={title}>
      <div className={styles.groupHeading}><h2>{isNew && <span className={styles.unreadDot} aria-hidden="true" />}{title}<span className={styles.groupCount}>{entries.length.toString().padStart(2, "0")}</span></h2><span className={styles.groupLine} /></div>
      <div className={styles.cards}>{entries.map((item) => <NotificationCard key={item.id} item={item} onOpen={openDetails} onToggle={toggleRead} onRemove={deleteItem} />)}</div>
    </section>;
  }
