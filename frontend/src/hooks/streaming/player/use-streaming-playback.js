"use client";

import { useEffect, useRef, useState } from "react";
import { streamingRequest } from "@/lib/api/streaming-data.mjs";

export default function useStreamingPlayback({ movie, profileId, access, onProgress }) {
  const [playback, setPlayback] = useState(null);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const progress = useRef({ positionSeconds: 0, version: 0 });
  const saving = useRef(false);
  const pending = useRef(null);
  const lastSaved = useRef(0);
  const filmId = movie.id;
  const accessId = access?.id;

  useEffect(() => {
    const controller = new AbortController();
    async function start() {
      try {
        const target = accessId ? `/${accessId}/play` : `/films/${filmId}/play`;
        const [saved, source] = await Promise.all([
          streamingRequest(`/profiles/${profileId}/progress/${filmId}`, { signal: controller.signal }).catch((cause) => {
            if (cause.status === 404) return null;
            throw cause;
          }),
          streamingRequest(target, { method: "POST", signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        if (!source?.url || !source?.expiresAt) throw new Error("Resposta inválida ao iniciar a reprodução.");
        progress.current = { positionSeconds: saved?.positionSeconds || 0, durationSeconds: saved?.durationSeconds, version: saved?.version || 0 };
        lastSaved.current = 0;
        setPlayback({ ...source, requestedFilmId: filmId, initialPosition: saved?.completed ? 0 : progress.current.positionSeconds });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause.message || "Não foi possível iniciar a reprodução.");
          setErrorCode(cause.code || null);
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void start();
    return () => controller.abort();
  }, [filmId, profileId, accessId]);

  async function savePosition(position, force = false, playbackDuration) {
    if (!playback || !Number.isFinite(position)) return;
    const youtube = playback.kind === "youtube";
    const duration = youtube ? Math.ceil(playbackDuration) : movie.durationSeconds;
    if (!Number.isSafeInteger(duration) || duration <= 0 || duration > movie.durationSeconds) return;
    const seconds = Math.max(0, Math.min(duration, Math.floor(position)));
    if (!seconds && !progress.current.version) return;
    if (!force && Date.now() - lastSaved.current < 15000) return;
    pending.current = { seconds, duration };
    if (saving.current) return;
    saving.current = true;
    try {
      while (pending.current) {
        const next = pending.current;
        pending.current = null;
        if (next.seconds === progress.current.positionSeconds && next.duration === progress.current.durationSeconds) continue;
        try {
          const saved = await streamingRequest(`/profiles/${profileId}/progress/${movie.id}`, {
            method: "PUT", keepalive: true,
            body: { positionSeconds: next.seconds, expectedVersion: progress.current.version,
              ...(youtube ? { playbackDurationSeconds: next.duration } : {}) },
          });
          progress.current = { positionSeconds: saved.positionSeconds, durationSeconds: saved.durationSeconds, version: saved.version };
          lastSaved.current = Date.now();
          setSaveError("");
          onProgress?.(saved);
        } catch (cause) {
          if (cause.status === 409) {
            try {
              const saved = await streamingRequest(`/profiles/${profileId}/progress/${movie.id}`);
              progress.current = { positionSeconds: saved.positionSeconds, durationSeconds: saved.durationSeconds, version: saved.version };
            } catch { /* A próxima atualização tentará novamente. */ }
          }
          setSaveError("Não foi possível salvar o ponto de reprodução.");
        }
      }
    } finally { saving.current = false; }
  }

  return { playback: playback?.requestedFilmId === movie.id ? playback : null, loading, error, errorCode, saveError, savePosition };
}
