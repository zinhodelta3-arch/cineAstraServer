'use client';

import LoadingImage from "@/components/ui/loading-image";
import { Popcorn } from 'lucide-react';
import { useState } from 'react';

export default function ProductImage({ src, alternatives = [], alt = '', className = '', fit = 'object-cover', showMissing = false }) {
  const [failed, setFailed] = useState([]);
  const current = [src, ...alternatives].find(url => url && !failed.includes(url));
  return current
    ? <LoadingImage key={current} src={current} alt={alt} loading="lazy" decoding="async"
      onError={() => setFailed(urls => [...urls, current])} className={`${fit} ${className}`} />
    : <span className={`flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground ${className}`} aria-hidden={!showMissing}>
      <Popcorn className="size-1/2 max-w-12" aria-hidden="true" />
      {showMissing && <span className="text-xs font-semibold">Foto indisponível</span>}
    </span>;
}
