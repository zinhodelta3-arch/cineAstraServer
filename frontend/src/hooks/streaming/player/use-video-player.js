"use client";
import { useCallback, useEffect, useRef, useState } from "react";
function youtubeEmbed(src) {
  if (!src) return null;
  try {
    const u = new URL(src);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname.replace(/^www\./, "");
    let id;
    if (host === "youtu.be") id = u.pathname.slice(1);
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return /^[\w-]{11}$/.test(id ?? "") ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
  } catch { return null; }
}
export default function useVideoPlayer({ media, options = {}, mode, onModeChange: setMode, onRestore, onEpisodeChange, onClose }) {
  const allEpisodes = (media.seasons ?? []).flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.number })));
  const [episodeId, setEpisodeId] = useState(options.episodeId ?? allEpisodes[0]?.id);
  const episode = allEpisodes.find((e) => e.id === episodeId) ?? allEpisodes[0];
  const content = media.type === "series" ? { ...media, ...episode } : media;
  const [season, setSeason] = useState(episode?.season ?? media.seasons?.[0]?.number);
  const [panel, setPanel] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [caption, setCaption] = useState(-1);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [full, setFull] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [storyboard, setStoryboard] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const dialog = useRef(null), shell = useRef(null), video = useRef(null), surface = useRef(null), timer = useRef(null), gesture = useRef(null);
  const autoPlayNext = useRef(false);
  const fullscreenOrigin = useRef(mode);
  const focusReturn = useRef(null);
  const currentRef = useRef(0);
  const embed = youtubeEmbed(content.src);
  const next = allEpisodes[allEpisodes.findIndex((e) => e.id === episode?.id) + 1];
  const frames = content.thumbnails ?? [];
  const thumbnail = frames.filter((f) => f.time <= (hoverTime ?? current)).at(-1) ?? frames[0];

  useEffect(() => {
    focusReturn.current = document.activeElement;
    return () => { clearTimeout(timer.current); focusReturn.current?.focus?.({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    // O mesmo <video> fica montado ao alternar entre os três tamanhos.
    if (node.open) node.close();
    if (mode === "mini" || mode === "page") node.show(); else node.showModal();
    if (mode === "modal" || mode === "expanded") {
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = overflow; };
    }
  }, [mode]);
  useEffect(() => {
    const changed = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    const drag = (e) => { if (gesture.current && gesture.current.y - e.clientY > 25) setStoryboard(true); };
    const end = () => { gesture.current = null; };
    window.addEventListener("pointermove", drag);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => { window.removeEventListener("pointermove", drag); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
  }, []);
  useEffect(() => {
    setCurrent(0); currentRef.current = 0; setDuration(0); setStarted(false); setPlaying(false); setError(""); setCaption(-1); setWaiting(false);

  }, [content.src, episodeId]);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.volume = volume; el.muted = muted; el.playbackRate = speed;
  }, [volume, muted, speed, content.src, episodeId]);
  useEffect(() => {
    const el = video.current;
    if (el) Array.from(el.textTracks).forEach((track, i) => { track.mode = i === caption ? "showing" : "disabled"; });
  }, [caption, episodeId]);

  useEffect(() => {
    if (options.episodeId && options.episodeId !== episodeId) {
      const selected = allEpisodes.find((e) => e.id === options.episodeId);
      if (selected) { autoPlayNext.current = true; setEpisodeId(selected.id); setSeason(selected.season); setPanel(null); }
    }
  }, [options.episodeId, options.selectionToken]);
  useEffect(() => { onEpisodeChange?.(episode?.id ?? null); }, [episode?.id, onEpisodeChange]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!shell.current?.querySelector(".ca-icon:hover, .ca-icon:focus-visible, .ca-panel:hover")) setControlsVisible(false);
    }, 3500);
  }, []);
  const toggle = useCallback(async () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      try { await el.play(); } catch { setError("Não foi possível iniciar. Tente reproduzir novamente."); }
    } else el.pause();
    showControls();
  }, [showControls]);
  const seek = useCallback((value) => {
    const el = video.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(value, el.duration));
    currentRef.current = el.currentTime; setCurrent(el.currentTime);
  }, []);
  const fullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (mode === "expanded") { setMode(fullscreenOrigin.current); return; }
    fullscreenOrigin.current = mode;
    try {
      if (shell.current?.requestFullscreen && document.fullscreenEnabled) { await shell.current.requestFullscreen(); return; }
      if (video.current?.webkitEnterFullscreen) { video.current.webkitEnterFullscreen(); return; }
    } catch { /* A prévia incorporada pode bloquear a API nativa. */ }
    // Fallback visível e reversível, inclusive quando a prévia bloqueia fullscreen.
    setMode("expanded");
  };
  const changeMode = async (newMode) => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    setPanel(null); setMode(newMode); showControls();
  };
  const selectEpisode = (item) => {
    autoPlayNext.current = true; setEpisodeId(item.id); setSeason(item.season); setPanel(null);
  };
  const close = () => {
    if (video.current) options.onPause?.(video.current.currentTime);
    video.current?.pause();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };
  const updated = () => {
    const el = video.current;
    currentRef.current = el.currentTime; setCurrent(el.currentTime);
    options.onTimeUpdate?.(el.currentTime);
  };
  const loaded = () => {
    const el = video.current;
    setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const saved = Number(options.initialPosition || 0);
    if (saved > 0 && saved < el.duration - 3) el.currentTime = saved;
    Array.from(el.textTracks).forEach((t) => { t.mode = "disabled"; });
    if (autoPlayNext.current || options.autoPlay) { autoPlayNext.current = false; el.play().catch(() => {}); }
  };
  const keyDown = (event) => {
    if (event.key === "Escape" && panel) { event.preventDefault(); event.stopPropagation(); setPanel(null); return; }
    if (event.key === "Escape" && mode === "mini") { event.preventDefault(); close(); return; }
    if (event.target.closest("input, select, textarea, button") || embed) return;
    if ([" ", "k", "ArrowLeft", "ArrowRight", "m", "f"].includes(event.key)) event.preventDefault();
    if (event.key === " " || event.key === "k") toggle();
    if (event.key === "ArrowLeft") seek(currentRef.current - 15);
    if (event.key === "ArrowRight") seek(currentRef.current + 15);
    if (event.key === "m") setMuted((v) => !v);
    if (event.key === "f") fullscreen();
    showControls();
  };
  const progressPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setHoverTime(position * duration);
    if (gesture.current && gesture.current.y - event.clientY > 25) setStoryboard(true);
  };
  const visible = controlsVisible || !playing || Boolean(panel) || storyboard || mode === "mini";

  const paused = () => { setPlaying(false); if (video.current) options.onPause?.(video.current.currentTime); };
  const ended = () => { setPlaying(false); if (video.current) options.onPause?.(video.current.duration); };
  return { dialog,mode,full,media,keyDown,panel,setPanel,close,shell,showControls,episode,embed,setSeason,season,allEpisodes,content,caption,setCaption,speed,setSpeed,volume,setVolume,muted,setMuted,playing,started,error,setError,waiting,setWaiting,video,loaded,updated,setPlaying,setStarted,visible,surface,toggle,fullscreen,changeMode,onRestore,next,selectEpisode,thumbnail,hoverTime,storyboard,setStoryboard,frames,gesture,progressPointer,duration,current,seek,setHoverTime,paused,ended };
}
