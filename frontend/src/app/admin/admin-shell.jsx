"use client";

import SessionControls from "@/components/auth/session-controls";
import { useSession } from "@/hooks/auth/use-session";
import { useState } from "react";
import { BadgePercent, CalendarDays, ChartNoAxesCombined, Clapperboard, Film, Headset, LayoutDashboard, MapPin, Megaphone, Menu, Popcorn, ShoppingBag, Truck, Users, UsersRound, X } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import styles from "./admin.module.css";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
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
    { label: "Equipamentos", href: "/admin/suprimentos/equipamentos" },
    { label: "Solicitações", href: "/admin/suprimentos/solicitacoes" },
    { label: "Logística", href: "/admin/suprimentos/logistica" },
  ] },
  { label: "Usuários", href: "/admin/usuarios", icon: UsersRound, children: [
    { label: "Privacidade", href: "/admin/usuarios/privacidade" },
  ] },
  { label: "Equipes", href: "/admin/equipes", icon: Users, children: [
    { label: "Membros", href: "/admin/equipes/membros" },
    { label: "Entradas", href: "/admin/equipes/entradas" },
    { label: "Chamados", href: "/admin/equipes/chamados" },
  ] },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone, children: [
    { label: "Experiências", href: "/admin/marketing/experiencias" },
    { label: "Parceiros", href: "/admin/marketing/parceiros" },
    { label: "Categorias", href: "/admin/marketing/categorias" },
    { label: "Campanhas", href: "/admin/marketing/campanhas" },
    { label: "Conteúdo", href: "/admin/marketing/conteudo" },
  ] },
  { label: "Relatórios", href: "/admin/relatorios", icon: ChartNoAxesCombined, children: [
    { label: "Destinação social", href: "/admin/relatorios/destinacao-social" },
    { label: "Auditoria", href: "/admin/relatorios/auditoria" },
    { label: "Logs HTTP", href: "/admin/relatorios/http" },
  ] },
  { label: "Suporte", href: "/admin/suporte", icon: Headset },
];

export default function AdminShell({ children, initialUser }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const session = useSession(initialUser);
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#admin-content">Pular para o conteúdo</a>
      <div className={styles.desktop}><AppSidebar items={items} user={session.user} onLogout={session.logout} loggingOut={session.pending} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} /></div>
      <div className={styles.content}>
        <div className={styles.mobileBar}>
          <span>CineAstra / Administração</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={styles.menu} aria-label="Abrir navegação"><Menu size={22} /></SheetTrigger>
            <SheetContent side="left" showCloseButton={false} className="w-72! gap-0">
              <SheetTitle className="sr-only">Navegação administrativa</SheetTitle>
              <SheetClose className={styles.close} aria-label="Fechar navegação"><X size={20} /></SheetClose>
              <AppSidebar items={items} user={session.user} onLogout={session.logout} loggingOut={session.pending} mobile onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex justify-end p-4"><SessionControls session={session} /></div>
        {children}
      </div>
    </div>
  );
}
