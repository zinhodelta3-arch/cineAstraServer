"use client";

import { useState } from "react";

export function useMoviePoster(src) {
  const [failedSource, setFailedSource] = useState(null);
  return { failed: !src || failedSource === src, onError: () => setFailedSource(src) };
}
