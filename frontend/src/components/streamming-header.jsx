"use client";

import Link from "next/link";
import { ArrowLeft, CircleHelp, Film, LayoutGrid, Menu, UserRound, X } from "lucide-react";
import { AppearanceSelector } from "@/components/appearance-selector";
import SessionControls from "@/components/auth/session-controls";
import { NotificationButton } from "@/components/notifications/notification-button";
import useStreamingHeader from "@/hooks/streaming/use-streaming-header";
import CineAstraLogo from "@/components/branding/cineastra-logo";
import HeaderSearch from "@/components/streaming/search/header-search";
import styles from "@/components/streaming/streaming-header.module.css";

const navigation = [
  { label: "Filmes", href: "/streaming/home", icon: Film },
  { label: "Categorias", href: "/streaming/categorias", icon: LayoutGrid },
  { label: "Minha CineAstra", href: "/streaming/meuperfil", icon: UserRound },
  { label: "Suporte", href: "/cinema/suporte", icon: CircleHelp },
];

function CinemaLink({ compact = false, onClick }) {
  return <Link href="/cinema/home" className={styles.backLink} onClick={onClick}>
    <ArrowLeft size={16} aria-hidden="true" />
    {compact ? "Voltar ao cinema" : <span className={styles.backCopy}><small>Voltar ao</small>Cinema</span>}
  </Link>;
}

function Navigation({ isActive, onNavigate }) {
  return navigation.map(({ label, href, icon: Icon }) => <Link
    key={href} href={href} onClick={onNavigate}
    className={styles.navLink} aria-current={isActive(href) ? "page" : undefined}
  ><Icon size={16} aria-hidden="true" />{label}</Link>);
}

export default function StreammingHeader() {
  const { session, menuId, menuOpen, headerRef, menuButtonRef, toggleMenu, closeMenu, isActive } = useStreamingHeader();

  return <header ref={headerRef} className={styles.header}>
    <div className={styles.ticket}>
      <span className={`${styles.perforation} ${styles.perforationTop}`} aria-hidden="true" />
      <span className={`${styles.perforation} ${styles.perforationBottom}`} aria-hidden="true" />
      <div className={styles.row}>
        <Link href="/streaming/home" onClick={closeMenu} className={styles.brand} aria-label="CineAstra Streaming — início">
          <CineAstraLogo className={styles.logo} />
          <span className={styles.wordmark} aria-hidden="true">
            <span className={styles.name}>cine<span>astra.</span></span>
            <span className={styles.edition}>Streaming</span>
          </span>
        </Link>

        <nav aria-label="Navegação do streaming" className={styles.desktopNav}>
          <Navigation isActive={isActive} />
        </nav>

        <div className={styles.utilities}>
        <div className={styles.actions}>
          <HeaderSearch />
          {session.user && <NotificationButton key={session.user.id} userId={session.user.id} />}
          <div className={styles.appearance}><AppearanceSelector /></div>
          <SessionControls session={session} />
          <button ref={menuButtonRef} type="button" onClick={toggleMenu} className={styles.menuToggle}
            aria-label={menuOpen ? "Fechar menu do streaming" : "Abrir menu do streaming"}
            aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined}>
            {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>

        <div className={styles.cinemaStub}><CinemaLink /></div>
        </div>
      </div>

      <div className={styles.mobileUtility}>
        <CinemaLink compact onClick={closeMenu} />
        <AppearanceSelector />
      </div>

      {menuOpen && <nav id={menuId} aria-label="Navegação mobile do streaming" className={styles.mobileNav}>
        <Navigation isActive={isActive} onNavigate={closeMenu} />
      </nav>}
    </div>
  </header>;
}
