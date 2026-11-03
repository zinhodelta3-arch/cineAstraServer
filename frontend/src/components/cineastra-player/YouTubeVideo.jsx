"use client";

import useYouTubePlayer from "@/hooks/streaming/player/use-youtube-player";

export default function YouTubeVideo({ src, title, options }) {
  const { host, error } = useYouTubePlayer({ src, options });
  return <>
    <div ref={host} className="ca-youtube" aria-label={`Trailer oficial de ${title}`} />
    {error && <div className="ca-error" role="alert"><p>{error}</p></div>}
  </>;
}
