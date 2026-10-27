import styles from "./notifications.module.css";
import { Film } from "lucide-react";

export default function NotificationHeader({ headingRef }) {
  return (
        <header className={styles.pageHeader}>
          <div><p className={styles.eyebrow}><Film size={16} aria-hidden="true" /> SUA CONEXÃO COM A PRÓXIMA CENA</p><h1 className={styles.display} ref={headingRef} tabIndex={-1}>Notificações<span className={styles.titleDot}>.</span></h1><p className={styles.intro}>Dos ingressos às nossas conversas. Tudo passa por aqui.</p></div>
          <div className={styles.edition} aria-hidden="true"><span>CINEASTRA</span><strong>CA / 03</strong><span>CENTRAL DE ATIVIDADES</span></div>
        </header>
  );
}
