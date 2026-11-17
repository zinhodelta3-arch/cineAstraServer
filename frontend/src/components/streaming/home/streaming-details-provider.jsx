"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DetailsModal from "./details-modal";

const StreamingDetailsContext = createContext(null);

export function useStreamingDetails() {
  return useContext(StreamingDetailsContext);
}

export default function StreamingDetailsProvider({ children }) {
  const router = useRouter();
  const [selection, setSelection] = useState(null);
  const [open, setOpen] = useState(false);
  const opener = useRef(null);

  const openDetails = useCallback((movie, options = {}) => {
    opener.current = options.opener ?? document.activeElement;
    setSelection(previous => ({ movie, ...options, sequence: (previous?.sequence ?? 0) + 1 }));
    setOpen(true);
  }, []);

  return <StreamingDetailsContext.Provider value={openDetails}>
    {children}
    {selection && <DetailsModal
      key={selection.sequence}
      {...selection}
      open={open}
      onOpenChange={setOpen}
      returnFocus={() => opener.current?.isConnected ? opener.current : false}
      onPlay={(movie) => {
        opener.current = null;
        setOpen(false);
        router.push(`/streaming/assistir/filme/${encodeURIComponent(movie.id)}?reproduzir=1`);
      }}
    />}
  </StreamingDetailsContext.Provider>;
}
