"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, PictureInPicture2 } from "lucide-react";
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
  const surface = useRef(null);
  const onFilmPage = session?.pathname === pathname;

  useEffect(() => {
    setSession(current => {
      if (!current) return current;
      if (current.pathname === pathname) return current.restoring ? { ...current, mode: "page", restoring: false } : current;
      return current.mode === "mini" ? current : null;
    });
  }, [pathname, setSession]);

  if (!session || (!onFilmPage && session.mode !== "mini")) return null;

  async function restore() {
    const pip = document.pictureInPictureElement;
    if (pip && surface.current?.contains(pip)) await document.exitPictureInPicture().catch(() => {});
    if (onFilmPage) setSession(current => current === session ? { ...current, mode: "page" } : current);
    else {
      setSession(current => current === session ? { ...current, restoring: true } : current);
      router.push(session.pathname);
    }
  }

  return <div ref={surface} className={onFilmPage ? watch.stage : watch.floating} role={onFilmPage ? "main" : undefined}
    aria-label={onFilmPage ? "Reprodução do filme" : undefined}>
    {onFilmPage && session.mode === "mini" && <section className={watch.placeholder} aria-labelledby="streaming-mini-title">
      <div className={watch.placeholderHeader}>{session.movie.title}</div>
      <div className={watch.placeholderFrame}>
        <PictureInPicture2 size={34} aria-hidden="true" />
        <h1 id="streaming-mini-title">Vídeo em janela flutuante</h1>
        <button className={watch.primary} type="button" onClick={restore}>
          <ArrowUpRight size={17} aria-hidden="true" />Voltar ao player principal
        </button>
      </div>
    </section>}
    <PlayerModal {...session} initialMode="page"
      onModeChange={(mode) => setSession(current => current ? { ...current, mode } : current)}
      onRestore={restore}
      onClose={() => setSession(null)}
    />
  </div>;
}
