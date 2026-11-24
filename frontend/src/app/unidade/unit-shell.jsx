'use client';

import { useState } from 'react';
import { Armchair, Clapperboard, Film, LayoutDashboard, ListChecks, Menu, MessageCircle, Popcorn, Radio, TicketCheck, UsersRound, X } from 'lucide-react';
import { useTablePreference } from "@/hooks/use-table-preference";
import { AppSidebar } from '@/components/app-sidebar';
import { useSessionNavigation } from '@/components/session-context/session-context';
import SessionControls from '@/components/auth/session-controls';
import { NotificationButton } from '@/components/notifications/notification-button';
import { useSession } from '@/hooks/auth/use-session';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import styles from '../admin/admin.module.css';

const teamItems = [
  { label: 'Visão geral', href: '/unidade', icon: LayoutDashboard },
  { label: 'Equipes', href: '/unidade/equipes', icon: UsersRound },
  { label: 'Chamados operacionais', href: '/unidade/chamados', icon: ListChecks },
  { label: 'Suporte', href: '/unidade/suporte', icon: MessageCircle },
  { label: 'Atendimento', href: '/unidade/atendimento', icon: TicketCheck },
];
const supervisorItems = [
  teamItems[0],
  { label: 'Filmes', href: '/unidade/filmes', icon: Film },
  { label: 'Sessões', href: '/unidade/sessoes', icon: Clapperboard },
  { label: 'Salas', href: '/unidade/salas', icon: Armchair },
  { label: 'AstraSnack', href: '/unidade/astrasnack', icon: Popcorn },
  { label: 'Experiências', href: '/unidade/experiencias', icon: TicketCheck },
  { label: 'Comunicação', href: '/unidade/comunicacao', icon: Radio },
  ...teamItems.slice(1),
];

export default function UnitShell({ children }) {
  const session = useSession();
  const sessionNavigation = useSessionNavigation('unit');
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useTablePreference('menu:unidade',false);
  const areaLabel = session.user?.role === 'SUPERVISOR' ? 'Supervisão da unidade' : 'Equipe da unidade';
  const sidebar = props => <AppSidebar items={session.user?.role === 'SUPERVISOR' ? supervisorItems : supervisorItems.filter(item => !['/unidade/experiencias','/unidade/comunicacao'].includes(item.href))} hrefFor={sessionNavigation} user={session.user} onLogout={session.logout} loggingOut={session.pending} homeHref="/unidade" areaLabel={areaLabel} {...props} />;
  return <div className={styles.shell}>
    <a className={styles.skip} href="#unit-content">Pular para o conteúdo</a>
    <div className={styles.desktop}>{sidebar({ collapsed, onToggle: () => setCollapsed(!collapsed) })}</div>
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
      <div className="flex items-center justify-end gap-2 p-4">
        {session.user && <NotificationButton userId={session.user.id} role={session.user.role} />}
        <SessionControls session={session} />
      </div>
      {children}
    </div>
  </div>;
}
