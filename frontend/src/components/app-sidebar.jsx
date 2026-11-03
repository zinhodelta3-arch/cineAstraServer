"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, LogOut, Search, UserRound } from "lucide-react";
import { AppearanceSelector } from "@/components/appearance-selector";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import styles from "./app-sidebar.module.css";

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
const isCurrent = (pathname, href) => Boolean(href && (pathname === href || !['/unidade', '/fornecedor'].includes(href) && pathname.startsWith(`${href}/`)));

function useThemeLogo() {
  const [logo, setLogo] = useState("/CineAstralogou.png");

  useEffect(() => {
    const root = document.documentElement;
    function updateLogo() {
      const theme = (root.getAttribute("data-theme") || "").toLowerCase();
      if (/catp|latte|frappe|macchiato/.test(theme)) setLogo("/Catp.png");
      else if (theme.includes("mocha")) setLogo("/Mocha.png");
      else if (theme.includes("violet")) setLogo("/Violet.png");
      else setLogo("/CineAstralogou.png");
    }
    updateLogo();
    const observer = new MutationObserver(updateLogo);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return logo;
}

function getInitials(user) {
  const name = user?.name?.trim();
  if (!name) return <UserRound size={18} aria-hidden="true" />;
  const parts = name.split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : "")).toUpperCase();
}

function NavigationItem({ item, pathname, collapsed, searching }) {
  const Icon = item.icon;
  const children = item.children ?? [];
  const hasChildren = children.length > 0;
  const selected = isCurrent(pathname, item.href) || children.some((child) => isCurrent(pathname, child.href));
  const [open, setOpen] = useState(selected);
  useEffect(() => { if (selected || searching) setOpen(true); }, [selected, searching]);
  const itemClass = `${styles.navItem} ${selected ? styles.navItemActive : ""} ${collapsed ? styles.navItemCollapsed : ""}`;
  if (!hasChildren && !item.href) return null;

  if (!hasChildren) return <li>
    <Link href={item.href} className={itemClass} aria-current={selected ? "page" : undefined} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}>
      {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  </li>;

  if (collapsed) return <li>
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className={itemClass} aria-label={`Abrir ${item.label}`} title={item.label} />}>
        {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className={styles.flyout} aria-label={item.label}>
        <p className={styles.flyoutTitle}>{item.label}</p>
        <DropdownMenuItem render={<Link href={item.href} />} className={styles.flyoutLink} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</DropdownMenuItem>
        {children.map((child) => <DropdownMenuItem key={child.href} render={<Link href={child.href} />} className={styles.flyoutLink} aria-current={isCurrent(pathname, child.href) ? "page" : undefined}>{child.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  </li>;

  return <li>
    <div className={styles.navGroup}>
      <Link href={item.href} className={itemClass} aria-current={pathname === item.href ? "page" : undefined}>
        {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
        <span>{item.label}</span>
      </Link>
      <button type="button" className={styles.groupToggle} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={`${open ? "Recolher" : "Expandir"} subcategorias de ${item.label}`}><ChevronDown className={styles.groupChevron} size={15} aria-hidden="true" /></button>
    </div>
    {open && <ul className={styles.subnav}>{children.map((child) => <li key={child.href}>
        <Link href={child.href} className={`${styles.subnavLink} ${isCurrent(pathname, child.href) ? styles.subnavActive : ""}`} aria-current={isCurrent(pathname, child.href) ? "page" : undefined}>{child.label}</Link>
      </li>)}</ul>}
  </li>;
}

export function AppSidebar({ items = [], user, onLogout, loggingOut = false, collapsed = false, onToggle, onNavigate, mobile = false, className = "", homeHref = "/admin/dashboard", areaLabel = "Administração" }) {
  const pathname = usePathname();
  const logo = useThemeLogo();
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const focusSearchOnOpen = useRef(false);
  const search = normalize(query.trim());
  const visibleItems = items.map((item) => {
    if (!search) return item;
    if (normalize(item.label).includes(search)) return item;
    const children = item.children?.filter((child) => normalize(child.label).includes(search));
    return children?.length ? { ...item, children } : null;
  }).filter(Boolean);

  useEffect(() => {
    if (!collapsed && focusSearchOnOpen.current) {
      focusSearchOnOpen.current = false;
      searchRef.current?.focus();
    }
  }, [collapsed]);

  function toggle() {
    if (!collapsed) setQuery("");
    onToggle?.();
  }

  function expandForSearch() {
    focusSearchOnOpen.current = true;
    onToggle?.();
  }

  return <aside aria-label={`Menu lateral de ${areaLabel}`} className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobile ? styles.mobile : ""} ${className}`} onClick={(event) => { if (event.target.closest("a")) onNavigate?.(); }}>
    <div className={styles.brand}>
      <Link href={homeHref} className={styles.brandLink} aria-label="CineAstra — Início" title={collapsed ? "CineAstra" : undefined}>
        <img src={logo} alt="" width={38} height={38} className={styles.logo} />
        {!collapsed && <span className={styles.wordmark}>cine<span>astra.</span></span>}
      </Link>
      {!mobile && <button type="button" className={styles.collapseToggle} onClick={toggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed} title={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button>}
    </div>

    <nav className={styles.navigation} aria-label={`Navegação de ${areaLabel}`}>
      {collapsed ? <button type="button" className={styles.searchButton} onClick={expandForSearch} aria-label="Expandir menu e buscar" title="Buscar páginas"><Search size={18} aria-hidden="true" /></button>
        : <label className={styles.searchField}><Search size={17} aria-hidden="true" /><span className="sr-only">Buscar página no menu</span><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar página" /></label>}
      {!collapsed && <p className={styles.sectionLabel}>Navegação</p>}
      <ul className={styles.navList}>{visibleItems.map((item) => <NavigationItem key={item.href || item.label} item={item} pathname={pathname} collapsed={collapsed} searching={Boolean(search)} />)}</ul>
      {!collapsed && !visibleItems.length && <p className={styles.noResults}>Nenhuma página encontrada.</p>}
    </nav>

    <footer className={styles.footer}>
      <div className={styles.appearance}>{!collapsed && <span>Aparência</span>}<AppearanceSelector /></div>
      <div className={styles.profile} title={collapsed ? user?.name || "Administrador" : undefined}>
        <span className={styles.avatar} aria-hidden="true">{getInitials(user)}</span>
        {!collapsed && <span className={styles.profileText}><strong>{user?.name || "Usuário"}</strong><small>{areaLabel}</small></span>}
      </div>
      <button type="button" className={styles.logout} onClick={onLogout} disabled={!onLogout || !user || loggingOut} aria-busy={loggingOut} aria-label={collapsed ? "Sair da conta" : undefined} title={collapsed ? "Sair da conta" : undefined}>
        {loggingOut ? <LoaderCircle className={styles.loadingIcon} size={17} aria-hidden="true" /> : <LogOut size={17} strokeWidth={1.8} aria-hidden="true" />}
        {!collapsed && <span>{loggingOut ? "Saindo…" : "Sair da conta"}</span>}
      </button>
    </footer>
  </aside>;
}
