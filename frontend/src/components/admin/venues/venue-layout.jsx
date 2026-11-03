"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import page from "../tabelaexemplo/example-table.module.css";
import styles from "../catalog/catalog.module.css";

const sections = [
  { href: "/admin/locais", label: "Cinemas" },
  { href: "/admin/locais/salas", label: "Salas" },
  { href: "/admin/locais/assentos", label: "Assentos" },
];

export default function VenueLayout({ title, description, action, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={page.page}>
    <header className={page.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    <nav className={styles.tabs} aria-label="Seções de locais">{sections.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
    {children}
  </main>;
}

export function VenueState({ list, empty, noun }) {
  if (list.loading) return <p className={styles.state} role="status">Carregando {noun}…</p>;
  if (list.error) return <div className={styles.state} role="alert"><p>{list.error}</p><button type="button" onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={styles.state}>{empty}</p>;
  return null;
}

export function VenuePicker({ label, value, list, idKey, onChange, placeholder, selected }) {
  return <div className={styles.pickerControl}>
    <label>{label}<select value={value ?? ""} onChange={(event) => onChange(list.items.find((item) => item[idKey] === event.target.value) ?? (selected?.[idKey] === event.target.value ? selected : null))} disabled={list.loading || (!list.items.length && !selected)}>
      <option value="">{placeholder}</option>{selected && !list.items.some((item) => item[idKey] === selected[idKey]) && <option value={selected[idKey]}>{selected.nome}</option>}{list.items.map((item) => <option key={item[idKey]} value={item[idKey]}>{item.nome}</option>)}
    </select></label>
    {list.nextCursor && <button type="button" className={styles.secondary} onClick={list.loadMore} disabled={list.loadingMore}>{list.loadingMore ? "Carregando…" : `Mais ${label.toLowerCase()}`}</button>}
    {list.error && <span className={styles.error} role="alert">{list.error}</span>}
  </div>;
}
