"use client";

import useNotificationCenter from "@/hooks/cinema/notificacao/use-notification-center";
import styles from "./notifications.module.css";
import { ArrowLeft, ArrowRight, BellOff, Undo2, X } from "lucide-react";
import Link from "next/link";
import Filmstrip from "./filmstrip";
import ClapWatermark from "./clap-watermark";
import NotificationDialog from "./notification-dialog";
import NotificationGroup from "./notification-group";
import NotificationHeader from "./notification-header";
import NotificationToolbar from "./notification-toolbar";
import NotificationSummary from "./notification-summary";

export default function NotificationCenter() {
  const { items, ready, persistent, unreadCount, filter, setFilter, selected, removed, announcement, headingRef, unread, read, emptyFilter, openDetails, closeDetails, toggleRead, deleteItem, readAll, undoRemoval, dismissUndo, showAll } = useNotificationCenter();
  return <main className={styles.root}>
    <Filmstrip />
    <div className={styles.stage}>
      <ClapWatermark />
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Caminho da página"><Link href="/"><ArrowLeft size={14} aria-hidden="true" />Início</Link><span aria-hidden="true">/</span><span aria-current="page">Notificações</span></nav>
<NotificationHeader headingRef={headingRef} />

        <div className={styles.contentGrid}>
          <div className={styles.feed}>
<NotificationToolbar items={items} ready={ready} unreadCount={unreadCount} read={read} filter={filter} setFilter={setFilter} readAll={readAll} />
            {!persistent && <p className={styles.storageNotice} role="status">As alterações funcionam nesta visita, mas não foi possível salvá-las neste navegador.</p>}
            {!ready ? <div className={styles.loading} role="status">Carregando suas notificações…</div> : items.length === 0 || emptyFilter ? <section className={styles.empty}>
              <div className={styles.emptyIcon}><BellOff size={35} strokeWidth={1.2} aria-hidden="true" /></div>
              <p className={styles.eyebrow}>{items.length === 0 ? "UM INTERVALO ENTRE AS CENAS" : "TUDO EM ORDEM POR AQUI"}</p>
              <h2 className={styles.display}>{items.length === 0 ? <>Você não tem<br />notificações.</> : filter === "unread" ? <>Nenhuma novidade<br />ficou para trás.</> : <>Ainda não há<br />atividades lidas.</>}</h2>
              <p>{items.length === 0 ? "Quando uma nova história chegar, a gente avisa por aqui." : filter === "unread" ? "Você já conferiu todos os seus avisos." : "As notificações que você abrir vão aparecer aqui."}</p>
              {emptyFilter && items.length > 0 ? <button type="button" className={styles.outlineButton} onClick={showAll}>Ver todas <ArrowRight size={16} aria-hidden="true" /></button> : <Link className={styles.outlineButton} href="/">Voltar ao início <ArrowRight size={16} aria-hidden="true" /></Link>}
            </section> : <>{filter !== "read" && <NotificationGroup title="Novas atividades" entries={unread} isNew openDetails={openDetails} toggleRead={toggleRead} deleteItem={deleteItem} />}{filter !== "unread" && <NotificationGroup title="Atividades lidas" entries={read} isNew={false} openDetails={openDetails} toggleRead={toggleRead} deleteItem={deleteItem} />}</>}
            {removed && <div className={styles.undoBar}><span>Notificação excluída.</span><button type="button" onClick={undoRemoval}><Undo2 size={15} aria-hidden="true" />Desfazer</button><button type="button" onClick={dismissUndo} aria-label="Dispensar opção de desfazer"><X size={16} /></button></div>}
          </div>

<NotificationSummary ready={ready} unreadCount={unreadCount} />
        </div>
        <footer className={styles.pageFooter}><span>CINEASTRA · CADA HISTÓRIA IMPORTA</span><span>FIM DO ROLO <span aria-hidden="true">✦</span></span></footer>
      </div>
    </div>
    <Filmstrip />
    <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    {selected && <NotificationDialog item={selected} onClose={closeDetails} />}
  </main>;
}
