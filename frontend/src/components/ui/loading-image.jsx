"use client";

import { useCallback, useState } from "react";

export default function LoadingImage({ src, onLoad, onError, ...props }) {
  const [finished, setFinished] = useState(null);
  const trackCachedImage = useCallback(image => {
    if (image?.complete && image.naturalWidth > 0) setFinished(src);
  }, [src]);
  return <img {...props} ref={trackCachedImage} src={src} data-image-loading={Boolean(src && finished !== src)}
    onLoad={event => {
      setFinished(src);
      onLoad?.(event);
    }}
    onError={event => {
      setFinished(src);
      onError?.(event);
    }} />;
}
