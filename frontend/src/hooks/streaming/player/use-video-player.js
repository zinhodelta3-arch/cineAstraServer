"use client";
import { useEffect, useRef, useState } from "react";
import { youtubeEmbed } from "@/lib/api/youtube-embed.mjs";
export default function useVideoPlayer({ media, options = {}, mode, onModeChange: setMode, onRestore, onEpisodeChange, onClose }) {
  const allEpisodes = (media.seasons ?? []).flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.number })));
  const [episodeId, setEpisodeId] = useState(options.episodeId ?? allEpisodes[0]?.id);
  const [selection, setSelection] = useState({ id: options.episodeId, token: options.selectionToken });
  const [autoPlayEpisode, setAutoPlayEpisode] = useState(null);
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
  const [tracks, setTracks] = useState({ captions: [], audio: [] });
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [full, setFull] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [storyboard, setStoryboard] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const dialog = useRef(null), shell = useRef(null), video = useRef(null), surface = useRef(null), timer = useRef(null), gesture = useRef(null);
  const mediaKey = JSON.stringify([episode?.id ?? media.id, content.src]);
  const [previousMediaKey, setPreviousMediaKey] = useState(mediaKey);
  const [pip, setPip] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [controlError, setControlError] = useState("");
  const fullscreenOrigin = useRef(mode);
  const focusReturn = useRef(null);
  const embed = youtubeEmbed(content.src);
  const next = allEpisodes[allEpisodes.findIndex((e) => e.id === episode?.id) + 1];
  const frames = content.thumbnails ?? [];
  const thumbnail = frames.filter((f) => f.time <= (hoverTime ?? current)).at(-1) ?? frames[0];
  if (selection.id !== options.episodeId || selection.token !== options.selectionToken) {
    setSelection({ id: options.episodeId, token: options.selectionToken });
    const selected = allEpisodes.find((item) => item.id === options.episodeId);
    if (selected && selected.id !== episodeId) {
      setAutoPlayEpisode(selected.id);
      setEpisodeId(selected.id);
      setSeason(selected.season);
      setPanel(null);
    }
  }
  if (previousMediaKey !== mediaKey) {
    setPreviousMediaKey(mediaKey);
    setCurrent(0);
    setDuration(0);
    setStarted(false);
    setPlaying(false);
    setError("");
    setCaption(-1);
    setWaiting(false);
  }

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const lists = [element.textTracks, element.audioTracks].filter(Boolean);
    function update() {
      const captions = Array.from(element.textTracks ?? []).flatMap((track,index) =>
        ['captions','subtitles'].includes(track.kind) ? [{ index, label: track.label || track.language || `Legenda ${index + 1}` }] : []
      );
      const audio = Array.from(element.audioTracks ?? []).map((track,index) => ({
        index,label:track.label || track.language || `Faixa ${index + 1}`,enabled:track.enabled
      }));
      setTracks({ captions, audio });
    }
    const events = ['addtrack','removetrack','change'];
    for (const list of lists) for (const event of events) list.addEventListener(event,update);
    element.addEventListener('loadedmetadata',update);
    update();
    return () => {
      for (const list of lists) for (const event of events) list.removeEventListener(event,update);
      element.removeEventListener('loadedmetadata',update);
    };
  }, [mediaKey]);

  function selectAudio(index) {
    const audio = Array.from(video.current?.audioTracks ?? []);
    if (!audio[index]) return;
    audio.forEach((track,position)=>{track.enabled=position===index;});
    setTracks(previous=>({...previous,audio:previous.audio.map(track=>({...track,enabled:track.index===index}))}));
  }

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
    const screen = surface.current;
    const changed = () => setFull(document.fullscreenElement === screen);
    changed();
    document.addEventListener("fullscreenchange", changed);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      if (screen && document.fullscreenElement === screen) void document.exitFullscreen().catch(() => {});
    };
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
    const el = video.current;
    if (!el) return;
    setPipSupported(Boolean(document.pictureInPictureEnabled && el.requestPictureInPicture));
    setPip(false);
    const entered = () => setPip(true);
    const left = () => setPip(false);
    el.addEventListener("enterpictureinpicture", entered);
    el.addEventListener("leavepictureinpicture", left);
    // Start loading only after the video and its metadata handler are mounted.
    el.src = content.src;
    return () => {
      el.removeEventListener("enterpictureinpicture", entered);
      el.removeEventListener("leavepictureinpicture", left);
      if (document.pictureInPictureElement === el) void document.exitPictureInPicture().catch(() => {});
    };
  }, [content.src, mediaKey]);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.volume = volume; el.muted = muted; el.playbackRate = speed;
  }, [volume, muted, speed, content.src, episodeId]);
  useEffect(() => {
    const el = video.current;
    if (el) Array.from(el.textTracks).forEach((track, i) => { track.mode = i === caption ? "showing" : "disabled"; });
  }, [caption, mediaKey]);

  useEffect(() => { onEpisodeChange?.(episode?.id ?? null); }, [episode?.id, onEpisodeChange]);

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!shell.current?.querySelector(".ca-icon:hover, .ca-icon:focus-visible, .ca-panel:hover")) setControlsVisible(false);
    }, 3500);
  };
  const toggle = async () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      try { await el.play(); } catch { setError("Não foi possível iniciar. Tente reproduzir novamente."); }
    } else el.pause();
    showControls();
  };
  const seek = (value) => {
    const el = video.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(value, el.duration));
    setCurrent(el.currentTime);
  };
  const fullscreen = async () => {
    if (document.fullscreenElement === surface.current) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (mode === "expanded") { setMode(fullscreenOrigin.current); return; }
    fullscreenOrigin.current = mode;
    try {
      if (surface.current?.requestFullscreen && document.fullscreenEnabled) { await surface.current.requestFullscreen(); surface.current?.focus(); return; }
      if (video.current?.webkitEnterFullscreen) { video.current.webkitEnterFullscreen(); return; }
    } catch { /* A prévia incorporada pode bloquear a API nativa. */ }
    // Fallback visível e reversível, inclusive quando a prévia bloqueia fullscreen.
    setMode("expanded");
  };
  const changeMode = async (newMode) => {
    if (document.fullscreenElement === surface.current) await document.exitFullscreen().catch(() => {});
    setPanel(null); setMode(newMode); showControls();
  };
  const togglePip = async () => {
    setControlError("");
    const element = video.current;
    if (!element?.requestPictureInPicture) return;
    try {
      if (document.pictureInPictureElement === element) {
        await document.exitPictureInPicture();
      } else {
        await element.requestPictureInPicture();
        await changeMode("mini");
      }
    } catch {
      setControlError("Não foi possível abrir o Picture-in-Picture neste vídeo.");
    }
  };
  const selectEpisode = (item) => {
    setAutoPlayEpisode(item.id); setEpisodeId(item.id); setSeason(item.season); setPanel(null);
  };
  const close = () => {
    if (video.current) options.onPause?.(video.current.currentTime);
    video.current?.pause();
    if (document.fullscreenElement === surface.current) document.exitFullscreen().catch(() => {});
    onClose();
  };
  const updated = () => {
    const el = video.current;
    setCurrent(el.currentTime);
    options.onTimeUpdate?.(el.currentTime);
  };
  const loaded = () => {
    const el = video.current;
    setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const saved = Number(options.initialPosition || 0);
    if (saved > 0 && saved < el.duration - 3) el.currentTime = saved;
    Array.from(el.textTracks).forEach((t) => { t.mode = "disabled"; });
    if ((autoPlayEpisode !== null && autoPlayEpisode === episode?.id) || options.autoPlay) {
      setAutoPlayEpisode(null);
      el.play().catch(() => {});
    }
  };
  const keyDown = (event) => {
    if (event.key === "Escape" && panel) { event.preventDefault(); event.stopPropagation(); setPanel(null); return; }
    if (event.key === "Escape" && mode === "mini") { event.preventDefault(); close(); return; }
    if (event.target.closest("input, select, textarea, button") || embed) return;
    if ([" ", "k", "ArrowLeft", "ArrowRight", "m", "f"].includes(event.key)) event.preventDefault();
    if (event.key === " " || event.key === "k") toggle();
    if (event.key === "ArrowLeft") seek((video.current?.currentTime ?? current) - 15);
    if (event.key === "ArrowRight") seek((video.current?.currentTime ?? current) + 15);
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
  const startProgressGesture = (event) => { gesture.current = { y: event.clientY }; };
  const endProgressGesture = () => { gesture.current = null; };
  const leaveProgress = () => { if (!gesture.current) setHoverTime(null); };
  const visible = controlsVisible || !playing || Boolean(panel) || storyboard || mode === "mini";

  const paused = () => { setPlaying(false); if (video.current) options.onPause?.(video.current.currentTime); };
  const ended = () => { setPlaying(false); if (video.current) options.onPause?.(video.current.duration); };
  return { tracks,selectAudio,dialog,mode,full,pip,pipSupported,controlError,togglePip,media,keyDown,panel,setPanel,close,shell,showControls,episode,embed,setSeason,season,allEpisodes,content,caption,setCaption,speed,setSpeed,volume,setVolume,muted,setMuted,playing,started,error,setError,waiting,setWaiting,video,loaded,updated,setPlaying,setStarted,visible,surface,toggle,fullscreen,changeMode,onRestore,next,selectEpisode,thumbnail,hoverTime,storyboard,setStoryboard,frames,startProgressGesture,endProgressGesture,leaveProgress,progressPointer,duration,current,seek,paused,ended };
}
