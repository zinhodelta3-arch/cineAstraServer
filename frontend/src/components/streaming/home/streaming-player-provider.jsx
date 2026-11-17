"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import PlayerModal from "./player-modal";
import watch from "../watch/film-watch.module.css";

const PlaybackContext = createContext(null);

export function useStreamingPlayer() {
  return useContext(PlaybackContext);
}

export default function StreamingPlayerProvider({ children }) {
  const [session, setSession] = useState(null);
  const play = useCallback((next) => {
    setSession((current) => current?.movie.id === next.movie.id && current.profileId === next.profileId
      ? { ...current, mode: "page", restoring: false }
      : { ...next, mode: "page" });
  }, []);
  const value = useMemo(() => ({ play, session, setSession }), [play, session]);

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function StreamingPlayerSurface() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setSession } = useStreamingPlayer();
  const onFilmPage = session?.pathname === pathname;

  useEffect(() => {
    setSession(current => {
      if (!current) return current;
      if (current.pathname === pathname) return current.restoring ? { ...current, mode: "page", restoring: false } : current;
      return current.mode === "mini" ? current : null;
    });
  }, [pathname, setSession]);

  if (!session || (!onFilmPage && session.mode !== "mini")) return null;
  return <div className={onFilmPage ? watch.stage : watch.floating} role={onFilmPage ? "main" : undefined}
    aria-label={onFilmPage ? "Reprodução do filme" : undefined}>
    <PlayerModal {...session} initialMode="page"
      onModeChange={(mode) => setSession(current => current ? { ...current, mode } : current)}
      onRestore={() => {
        if (onFilmPage) setSession(current => current ? { ...current, mode: "page" } : current);
        else {
          setSession(current => current ? { ...current, restoring: true } : current);
          router.push(session.pathname);
        }
      }}
      onClose={() => setSession(null)}
    />
  </div>;
}
