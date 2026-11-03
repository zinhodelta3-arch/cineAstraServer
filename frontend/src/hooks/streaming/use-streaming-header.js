"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/auth/use-session";

export default function useStreamingHeader() {
  const session = useSession();
  const pathname = usePathname() ?? "/streaming/home";
  const [menuPath, setMenuPath] = useState(null);
  const menuOpen = menuPath === pathname;
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event) => {
      if (event.key === "Escape") {
        setMenuPath(null);
        menuButtonRef.current?.focus();
      }
    };
    const outside = (event) => {
      if (!headerRef.current?.contains(event.target)) setMenuPath(null);
    };
    const desktop = window.matchMedia("(min-width: 1200px)");
    const resize = () => { if (desktop.matches) setMenuPath(null); };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", resize);
    };
  }, [menuOpen]);

  return {
    session, menuId, menuOpen, headerRef, menuButtonRef,
    toggleMenu: () => setMenuPath((current) => current === pathname ? null : pathname),
    closeMenu: () => setMenuPath(null),
    isActive: (href) => pathname === href || pathname.startsWith(`${href}/`),
  };
}
