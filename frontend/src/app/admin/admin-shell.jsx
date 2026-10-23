"use client";

import { useState } from "react";
import { Film, Home, LayoutDashboard, Menu, Popcorn, Table2, X } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import styles from "./admin.module.css";

const items = [
  { label: "Tabela exemplo", href: "/admin/tabelaexemplo", icon: Table2 },
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Página do cinema", href: "/cinema/home", icon: Home },
  { label: "Filmes em cartaz", href: "/cinema/filmes", icon: Film },
  { label: "AstraSnack", href: "/cinema/astrasnack", icon: Popcorn },
];

export default function AdminShell({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#admin-content">Pular para o conteúdo</a>
      <div className={styles.desktop}><AppSidebar items={items} /></div>
      <div className={styles.content}>
        <div className={styles.mobileBar}>
          <span>CineAstra / Administração</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={styles.menu} aria-label="Abrir navegação"><Menu size={22} /></SheetTrigger>
            <SheetContent side="left" showCloseButton={false} className="w-72! gap-0">
              <SheetTitle className="sr-only">Navegação administrativa</SheetTitle>
              <SheetClose className={styles.close} aria-label="Fechar navegação"><X size={20} /></SheetClose>
              <div onClick={(event) => { if (event.target.closest("a")) setOpen(false); }}><AppSidebar items={items} /></div>
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </div>
    </div>
  );
}
