'use client';

import { useState } from 'react';
import { Armchair, Clapperboard, Film, LayoutDashboard, ListChecks, Menu, Popcorn, UsersRound, X } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import SessionControls from '@/components/auth/session-controls';
import { useSession } from '@/hooks/auth/use-session';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import styles from '../admin/admin.module.css';

const teamItems = [
  { label: 'Visão geral', href: '/unidade', icon: LayoutDashboard },
  { label: 'Equipes', href: '/unidade/equipes', icon: UsersRound },
  { label: 'Chamados', href: '/unidade/chamados', icon: ListChecks },
];
const supervisorItems = [
  teamItems[0],
  { label: 'Filmes', href: '/unidade/filmes', icon: Film },
  { label: 'Sessões', href: '/unidade/sessoes', icon: Clapperboard },
  { label: 'Salas', href: '/unidade/salas', icon: Armchair },
  { label: 'AstraSnack', href: '/unidade/astrasnack', icon: Popcorn },
  ...teamItems.slice(1),
];

export default function UnitShell({ children, initialUser }) {
  const session = useSession(initialUser);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const areaLabel = session.user?.role === 'SUPERVISOR' ? 'Supervisão da unidade' : 'Equipe da unidade';
  const sidebar = props => <AppSidebar items={session.user?.role === 'SUPERVISOR' ? supervisorItems : teamItems} user={session.user} onLogout={session.logout} loggingOut={session.pending} homeHref="/unidade" areaLabel={areaLabel} {...props} />;
  return <div className={styles.shell}>
    <a className={styles.skip} href="#unit-content">Pular para o conteúdo</a>
    <div className={styles.desktop}>{sidebar({ collapsed, onToggle: () => setCollapsed(value => !value) })}</div>
    <div className={styles.content}>
      <div className={styles.mobileBar}>
        <span>CineAstra / {areaLabel}</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={styles.menu} aria-label="Abrir navegação"><Menu size={22} /></SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-72! gap-0">
            <SheetTitle className="sr-only">Navegação da unidade</SheetTitle>
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
