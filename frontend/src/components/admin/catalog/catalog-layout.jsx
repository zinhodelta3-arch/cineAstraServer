"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../tabelaexemplo/example-table.module.css";
import catalog from "./catalog.module.css";

const sections = [
  { href: "/admin/filmes", label: "Filmes" },
  { href: "/admin/filmes/generos", label: "Gêneros" },
  { href: "/admin/filmes/imagens", label: "Imagens" },
];

export default function CatalogLayout({ title, description, action, children }) {
  const pathname = usePathname();
  return <main id="admin-content" tabIndex={-1} className={styles.page}>
    <header className={styles.heading}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
    <nav className={catalog.tabs} aria-label="Seções do catálogo">{sections.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
    {children}
  </main>;
}

export function CatalogState({ list, empty, noun = "registros" }) {
  if (list.loading) return <p className={catalog.state} role="status">Carregando {noun}…</p>;
  if (list.error) return <div className={catalog.state} role="alert"><p>{list.error}</p><button type="button" onClick={list.reload}>Tentar novamente</button></div>;
  if (!list.items.length) return <p className={catalog.state}>{empty}</p>;
  return null;
}
