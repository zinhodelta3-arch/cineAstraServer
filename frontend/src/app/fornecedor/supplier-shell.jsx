'use client';

import { useState } from 'react';
import { Boxes, LayoutDashboard, Menu, Truck, UserRound, X } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import SessionControls from '@/components/auth/session-controls';
import { useSession } from '@/hooks/auth/use-session';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import styles from '../admin/admin.module.css';
import portal from '@/components/supplier/supplier-portal.module.css';

const items = [
  { label: 'Visão geral', href: '/fornecedor', icon: LayoutDashboard },
  { label: 'Estoque', href: '/fornecedor/estoque', icon: Boxes, children: [
    { label: 'Insumos', href: '/fornecedor/insumos' },
    { label: 'Equipamentos', href: '/fornecedor/equipamentos' }
  ] },
  { label: 'Entregas', href: '/fornecedor/entregas', icon: Truck, children: [
    { label: 'Solicitações', href: '/fornecedor/solicitacoes' },
    { label: 'Transportes', href: '/fornecedor/transportes' }
  ] },
  { label: 'Perfil', href: '/fornecedor/perfil', icon: UserRound },
];

export default function SupplierShell({ children }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebar = props => <AppSidebar items={items} user={session.user} onLogout={session.logout} loggingOut={session.pending} homeHref="/fornecedor" areaLabel="Fornecedor" {...props} />;
  return <div className={styles.shell}>
    <a className={styles.skip} href="#supplier-content">Pular para o conteúdo</a>
    <div className={styles.desktop}>{sidebar({ collapsed, onToggle: () => setCollapsed(value => !value) })}</div>
    <div className={styles.content}>
      <header className={portal.topbar}>
        <span className={portal.areaName}>Portal do fornecedor</span>
        <div className={portal.controls}>
          <SessionControls session={session} />
          <div className={portal.mobileNav}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={styles.menu} aria-label="Abrir navegação"><Menu size={22} /></SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-72! gap-0">
            <SheetTitle className="sr-only">Navegação do fornecedor</SheetTitle>
            <SheetClose className={styles.close} aria-label="Fechar navegação"><X size={20} /></SheetClose>
            {sidebar({ mobile: true, onNavigate: () => setOpen(false) })}
          </SheetContent>
        </Sheet>
          </div>
        </div>
      </header>
      {children}
    </div>
  </div>;
}
