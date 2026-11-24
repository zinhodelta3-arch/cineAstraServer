"use client";

import useNotificationDialog from "@/hooks/cinema/notificacao/use-notification-dialog";
import Link from "next/link";
import { Ticket, MessageCircle, Bell, X, Check, ArrowRight, Clapperboard } from "lucide-react";
import styles from "./notifications.module.css";

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default function NotificationDialog({ item, onClose, onRead, pending, error }) {
  const { dialogRef, id, handleBackdropClick } = useNotificationDialog(onClose);
  const Icon = item.type === "experience" ? Clapperboard : item.type === "ticket" ? Ticket : item.type === "support" ? MessageCircle : Bell;
  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={onClose} onClick={handleBackdropClick}>
    <div className={styles.filmstrip} aria-hidden="true" />
    <div className={styles.dialogBody}>
      <div className={styles.dialogTop}><span className={styles.eyebrow}><Icon size={16} aria-hidden="true" />{item.label}</span><button autoFocus type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar detalhes"><X size={20} /></button></div>
      <h2 id={`${id}-title`} className={styles.display}>{item.subject}</h2>
      {item.createdAt && <time dateTime={item.createdAt} className={styles.dialogTime}>{fullDateFormatter.format(new Date(item.createdAt))}</time>}
      <p id={`${id}-description`} className={`${styles.dialogDescription} whitespace-pre-wrap break-words`}>{item.details}</p>
      {item.href && <Link href={item.href} prefetch={false} onNavigate={onClose} className={styles.detailsButton}>{item.linkLabel ?? 'Abrir solicitação'} <ArrowRight size={15} aria-hidden="true" /></Link>}
      {item.fields.length>0&&<dl className={styles.detailGrid}>{item.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!item.read && onRead && <button type="button" className={styles.primaryButton} disabled={pending} onClick={onRead}>Marcar como lida</button>}
      <div className={styles.dialogFooter}><span>AVISO CINEASTRA</span><button type="button" className={styles.primaryButton} onClick={onClose}>Entendido <Check size={16} aria-hidden="true" /></button></div>
    </div>
  </dialog>;
}

