'use client';

import { useState } from 'react';
import { Boxes, ClipboardList, LayoutDashboard, Menu, Package, Truck, UserRound, X } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import SessionControls from '@/components/auth/session-controls';
import { useSession } from '@/hooks/auth/use-session';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import styles from '../admin/admin.module.css';

const items = [
  { label: 'Visão geral', href: '/fornecedor', icon: LayoutDashboard },
  { label: 'Produtos', href: '/fornecedor/insumos', icon: Package, children: [{ label: 'Equipamentos', href: '/fornecedor/equipamentos' }] },
  { label: 'Estoque', href: '/fornecedor/estoque', icon: Boxes },
  { label: 'Solicitações', href: '/fornecedor/solicitacoes', icon: ClipboardList },
  { label: 'Entregas', href: '/fornecedor/entregas', icon: Truck },
  { label: 'Transportes', href: '/fornecedor/transportes', icon: Truck },
  { label: 'Perfil', href: '/fornecedor/perfil', icon: UserRound },
];

export default function SupplierShell({ children, initialUser }) {
  const session = useSession(initialUser);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebar = props => <AppSidebar items={items} user={session.user} onLogout={session.logout} loggingOut={session.pending} homeHref="/fornecedor" areaLabel="Fornecedor" {...props} />;
  return <div className={styles.shell}>
    <a className={styles.skip} href="#supplier-content">Pular para o conteúdo</a>
    <div className={styles.desktop}>{sidebar({ collapsed, onToggle: () => setCollapsed(value => !value) })}</div>
    <div className={styles.content}>
      <div className={styles.mobileBar}>
        <span>CineAstra / Fornecedor</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={styles.menu} aria-label="Abrir navegação"><Menu size={22} /></SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-72! gap-0">
            <SheetTitle className="sr-only">Navegação do fornecedor</SheetTitle>
            <SheetClose className={styles.close} aria-label="Fechar navegação"><X size={20} /></SheetClose>
            {sidebar({ mobile: true, onNavigate: () => setOpen(false) })}
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex justify-end p-4"><SessionControls session={session} /></div>
      {children}
    </div>
  </div>;
}
