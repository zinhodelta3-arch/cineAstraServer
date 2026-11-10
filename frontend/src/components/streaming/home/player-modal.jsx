"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import useStreamingPlayback from "@/hooks/streaming/player/use-streaming-playback";

const VideoPlayer = dynamic(() => import("@/components/cineastra-player/VideoPlayer"), {
  ssr: false,
  loading: () => <p role="status" className="fixed inset-0 z-[1000] grid place-items-center bg-background/90 text-foreground">Carregando player…</p>,
});

export default function PlayerModal(props) {
  const { movie, profileId, access } = props;
  return <PlaybackSession key={JSON.stringify([profileId, movie.id, access?.id])} {...props} />;
}

function PlaybackSession({ movie, profileId, access, onProgress, onClose, initialMode = "modal" }) {
  const [mode, setMode] = useState(initialMode);
  const { playback, loading, error, errorCode, saveError, savePosition } = useStreamingPlayback({ movie, profileId, access, onProgress });

  if (!playback && initialMode === "page") return <div className="grid min-h-64 place-content-center gap-4 rounded-md border border-border bg-card p-6 text-center" role={error ? "alert" : "status"}>
    <p>{loading ? "Preparando reprodução…" : error || "Não foi possível iniciar a reprodução."}</p>
    {errorCode === "STREAMING_ACCESS_REQUIRED" && <Link href="/cinema/planos" className="text-primary underline">Conhecer os planos</Link>}
    {error && <button type="button" className="min-h-11 underline" onClick={onClose}>Voltar ao catálogo</button>}
  </div>;

  if (!playback) return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border border-border bg-card">
        <DialogTitle className="pr-8 text-xl font-bold">{movie.title}</DialogTitle>
        <DialogDescription>{loading ? "Preparando reprodução…" : "Não foi possível iniciar a reprodução."}</DialogDescription>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {errorCode === "STREAMING_ACCESS_REQUIRED" && <Button nativeButton={false} render={<Link href="/cinema/planos" />}>Conhecer os planos</Button>}
      </DialogContent>
    </Dialog>
  );

  return <>
    <VideoPlayer
      media={{ ...movie, type: "movie", src: playback.url }}
      options={{
        isTrailer: playback.kind === "youtube", autoPlay: true, initialPosition: playback.initialPosition,
        onTimeUpdate: (position, duration) => { void savePosition(position, false, duration); },
        onPause: (position, duration) => { void savePosition(position, true, duration); },
      }}
      mode={mode}
      onModeChange={setMode}
      onRestore={() => setMode(initialMode)}
      onClose={onClose}
    />
    {saveError && <p role="status" className="fixed bottom-4 left-4 z-[10001] max-w-sm rounded-md border border-border bg-card p-3 text-sm text-destructive">{saveError}</p>}
  </>;
}
