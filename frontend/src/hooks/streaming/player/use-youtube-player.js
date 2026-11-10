"use client";

import { useEffect, useRef, useState } from "react";

let apiPromise;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const fail = () => { clearTimeout(timeout); apiPromise = null; script?.remove(); reject(new Error("Não foi possível carregar o player do YouTube.")); };
    const timeout = setTimeout(fail, 20000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve(window.YT);
      if (typeof previous === "function") previous();
    };
    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.addEventListener("error", fail, { once: true });
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export default function useYouTubePlayer({ src, options }) {
  const host = useRef(null);
  const callbacks = useRef(options);
  const [failure, setFailure] = useState(null);
  useEffect(() => { callbacks.current = options; }, [options]);

  useEffect(() => {
    let disposed = false;
    let player;
    let played = false;
    let timer;
    const reportError = message => { if (!disposed) setFailure({ src, message }); };
    const flush = (force = false, ended = false) => {
      if (!played || !player?.getDuration) return;
      try {
        const duration = player.getDuration();
        const position = ended ? duration : player.getCurrentTime();
        if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(position)) return;
        if (force) callbacks.current.onPause?.(position, duration);
        else callbacks.current.onTimeUpdate?.(position, duration);
      } catch { /* O iframe pode já estar sendo removido durante a navegação. */ }
    };
    const hidden = () => { if (document.visibilityState === "hidden") flush(true); };
    const leaving = () => flush(true);
    loadYouTubeApi().then((YT) => {
      if (disposed || !host.current) return;
      const videoId = new URL(src).pathname.split("/").at(-1);
      if (!/^[\w-]{11}$/.test(videoId)) throw new Error("Trailer indisponível.");
      const mount = document.createElement("div");
      host.current.replaceChildren(mount);
      const { autoPlay, initialPosition } = callbacks.current;
      player = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com", width: "100%", height: "100%", videoId,
        playerVars: { origin: window.location.origin, playsinline: 1, rel: 0, autoplay: autoPlay ? 1 : 0,
          start: Math.max(0, Math.floor(initialPosition || 0)) },
        events: {
          onReady: () => {
            if (disposed) return;
            timer = setInterval(() => { if (player.getPlayerState() === 1) flush(); }, 1000);
          },
          onStateChange: ({ data }) => {
            if (disposed) return;
            if (data === 1) played = true;
            if (data === 2 || data === 0) flush(true, data === 0);
          },
          onError: () => reportError("Este trailer está indisponível no YouTube."),
        },
      });
    }).catch((cause) => reportError(cause.message || "Não foi possível carregar o trailer."));
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leaving);
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", leaving);
      flush(true);
      player?.destroy?.();
    };
  }, [src]);

  return { host, error: failure?.src === src ? failure.message : "" };
}
