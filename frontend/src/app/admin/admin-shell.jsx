"use client";

import SessionControls from "@/components/auth/session-controls";
import { useSession } from "@/hooks/auth/use-session";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, BadgePercent, CalendarDays, ChartNoAxesCombined, Clapperboard, Film, Headset, LayoutDashboard, MapPin, Megaphone, Menu, PanelsTopLeft, Popcorn, ShoppingBag, Truck, Users, UsersRound, X } from "lucide-react";
import { NotificationButton } from "@/components/notifications/notification-button";
import { useTablePreference } from "@/hooks/use-table-preference";
import { AppSidebar } from "@/components/app-sidebar";
import { useSessionNavigation } from "@/components/session-context/session-context";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import styles from "./admin.module.css";
import { areaDestinations } from "./area-destinations";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Áreas de trabalho", href: "/admin/areas", icon: PanelsTopLeft },
  { label: "Filmes", href: "/admin/filmes", icon: Film, children: [
    { label: "Gêneros", href: "/admin/filmes/generos" },
    { label: "Imagens", href: "/admin/filmes/imagens" },
  ] },
  { label: "Locais", href: "/admin/locais", icon: MapPin, children: [
    { label: "Salas", href: "/admin/locais/salas" },
    { label: "Assentos", href: "/admin/locais/assentos" },
  ] },
  { label: "Sessões", href: "/admin/sessoes", icon: CalendarDays, children: [
    { label: "Ingressos", href: "/admin/sessoes/ingressos" },
    { label: "Presença", href: "/admin/sessoes/presenca" },
  ] },
  { label: "AstraSnack", href: "/admin/astrasnack", icon: Popcorn, children: [
    { label: "Combos", href: "/admin/astrasnack/combos" },
    { label: "Imagens", href: "/admin/astrasnack/imagens" },
    { label: "Estoque", href: "/admin/astrasnack/estoque" },
  ] },
  { label: "Vendas", href: "/admin/vendas", icon: ShoppingBag, children: [
    { label: "Pagamentos", href: "/admin/vendas/pagamentos" },
    { label: "Reembolsos", href: "/admin/vendas/reembolsos" },
  ] },
  { label: "Streaming", href: "/admin/streaming", icon: Clapperboard, children: [
    { label: "Assinaturas", href: "/admin/streaming/assinaturas" },
    { label: "Acessos", href: "/admin/streaming/acessos" },
  ] },
  { label: "Precificação", href: "/admin/precificacao", icon: BadgePercent, children: [
    { label: "Custos e preços", href: "/admin/precificacao/custos" },
    { label: "Promoções", href: "/admin/precificacao/promocoes" },
    { label: "Cupons", href: "/admin/precificacao/cupons" },
  ] },
  { label: "Suprimentos", href: "/admin/suprimentos", icon: Truck, children: [
    { label: "Empresas", href: "/admin/suprimentos/empresas" },
    { label: "Equipamentos", href: "/admin/suprimentos/equipamentos" },
    { label: "Movimentações", href: "/admin/suprimentos/movimentacoes" },
    { label: "Solicitações", href: "/admin/suprimentos/solicitacoes" },
    { label: "Logística", href: "/admin/suprimentos/logistica" },
    { label: "Rotas de entrega", href: "/admin/suprimentos/rotas" },
  ] },
  { label: "Usuários", href: "/admin/usuarios", icon: UsersRound, children: [
    { label: "Privacidade", href: "/admin/usuarios/privacidade" },
  ] },
  { label: "Equipes", href: "/admin/equipes", icon: Users, children: [
    { label: "Membros", href: "/admin/equipes/membros" },
    { label: "Entradas", href: "/admin/equipes/entradas" },
    { label: "Chamados operacionais", href: "/admin/equipes/chamados" },
  ] },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone, children: [
    { label: "Experiências", href: "/admin/marketing/experiencias" },
    { label: "Solicitações de experiências", href: "/admin/marketing/solicitacoes-experiencias" },
    { label: "Parceiros", href: "/admin/marketing/parceiros" },
    { label: "Categorias", href: "/admin/marketing/categorias" },
    { label: "Campanhas", href: "/admin/marketing/campanhas" },
    { label: "Notícias", href: "/admin/marketing/noticias" },
    { label: "Conteúdo", href: "/admin/marketing/conteudo" },
  ] },
  { label: "Relatórios", href: "/admin/relatorios", icon: ChartNoAxesCombined, children: [
    { label: "Destinação social", href: "/admin/relatorios/destinacao-social" },
    { label: "Auditoria", href: "/admin/relatorios/auditoria" },
    { label: "Logs HTTP", href: "/admin/relatorios/http" },
  ] },
  { label: "Suporte", href: "/admin/suporte", icon: Headset },
];

function AdminAreaContext() {
  const path = usePathname();
  const id = useSearchParams().get("area");
  const area = areaDestinations.find(entry => entry.id === id && entry.links.some(link => link.href === path));
  if (!area) return null;

  return (
    <nav aria-label="Contexto da área de trabalho" className="mr-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center gap-2 font-semibold hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar à Administração
      </Link>
      <Link href={{ pathname: "/admin/areas", query: { area: area.id } }} className="inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground">{area.label}</Link>
    </nav>
  );
}

export default function AdminShell({ children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useTablePreference('menu:admin',false);
  const session = useSession();
  const sessionNavigation = useSessionNavigation('admin');
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#admin-content">Pular para o conteúdo</a>
      <div className={styles.desktop}><AppSidebar items={items} hrefFor={sessionNavigation} user={session.user} onLogout={session.logout} loggingOut={session.pending} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /></div>
      <div className={styles.content}>
        <div className={styles.mobileBar}>
          <span>CineAstra / Administração</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={styles.menu} aria-label="Abrir navegação"><Menu size={22} /></SheetTrigger>
            <SheetContent side="left" showCloseButton={false} className="w-72! gap-0">
              <SheetTitle className="sr-only">Navegação administrativa</SheetTitle>
              <SheetClose className={styles.close} aria-label="Fechar navegação"><X size={20} /></SheetClose>
              <AppSidebar items={items} hrefFor={sessionNavigation} user={session.user} onLogout={session.logout} loggingOut={session.pending} mobile onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 p-4">
          <Suspense><AdminAreaContext /></Suspense>
          {session.user && <NotificationButton userId={session.user.id} role={session.user.role} />}
          <SessionControls session={session} />
        </div>
        {children}
      </div>
    </div>
  );
}
