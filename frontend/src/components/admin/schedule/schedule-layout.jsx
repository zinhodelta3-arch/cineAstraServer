"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import page from "../tabelaexemplo/example-table.module.css";
import styles from "../catalog/catalog.module.css";

const sections = [
  { href: "/admin/sessoes", label: "Sessões" },
  { href: "/admin/sessoes/ingressos", label: "Ingressos" },
  { href: "/admin/sessoes/presenca", label: "Presença" },
];

export default function ScheduleLayout({ title, description, action, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={page.page}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    <nav className={styles.tabs} aria-label="Seções de sessões">{sections.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
    {children}
  </main>;
}

export function ScheduleState({ list, empty, noun }) {
  if (list.loading) return <p className={styles.state} role="status">Carregando {noun}…</p>;
  if (list.error) return <div className={styles.state} role="alert"><p>{list.error}</p><button type="button" onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={styles.state}>{empty}</p>;
  return null;
}
