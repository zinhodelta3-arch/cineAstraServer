"use client";

import { useState } from "react";

export default function usePurchasePoster(source) {
  const [failedSource, setFailedSource] = useState(null);
  const imageSrc = failedSource === source ? "/compras/posters/essencial.svg" : source;
  const handleError = () => setFailedSource(source);
  return { imageSrc, handleError };
}
