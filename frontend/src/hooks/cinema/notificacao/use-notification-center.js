"use client";

import { useRef, useState } from "react";
import { useNotifications } from "./use-notifications";

export default function useNotificationCenter() {
  const { items, ready, persistent, unreadCount, markRead, markAllRead, remove, restore } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [removed, setRemoved] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef(null);
  const returnFocusRef = useRef(null);
  const sorted = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const unread = sorted.filter((item) => !item.read);
  const read = sorted.filter((item) => item.read);

  function openDetails(item) {
    returnFocusRef.current = document.activeElement;
    setSelected(item);
    if (!item.read) { markRead(item.id); setAnnouncement("Notificação marcada como lida."); }
  }
  function closeDetails() {
    setSelected(null);
    requestAnimationFrame(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      else headingRef.current?.focus();
    });
  }
  function toggleRead(item) {
    markRead(item.id, !item.read);
    setAnnouncement(item.read ? "Notificação marcada como não lida." : "Notificação marcada como lida.");
    headingRef.current?.focus();
  }
  function deleteItem(item) {
    setRemoved(item); remove(item.id); setAnnouncement("Notificação excluída. Você pode desfazer a última exclusão.");
    headingRef.current?.focus();
  }
  const emptyFilter = (filter === "unread" && !unread.length) || (filter === "read" && !read.length);
  const readAll = () => { markAllRead(); setAnnouncement("Todas as notificações foram marcadas como lidas."); };
  const undoRemoval = () => { restore(removed); setRemoved(null); setAnnouncement("Notificação restaurada."); };
  const dismissUndo = () => setRemoved(null);
  const showAll = () => setFilter("all");
  return { items, ready, persistent, unreadCount, filter, setFilter, selected, removed, announcement, headingRef, unread, read, emptyFilter, openDetails, closeDetails, toggleRead, deleteItem, readAll, undoRemoval, dismissUndo, showAll };
}
