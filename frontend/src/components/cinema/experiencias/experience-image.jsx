'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import LoadingImage from '@/components/ui/loading-image';

export default function ExperienceImage({ src, alt, className, priority = false }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <LoadingImage src={src} alt={alt ?? ''} loading={priority ? undefined : 'lazy'} fetchPriority={priority ? 'high' : undefined}
      className={`block bg-muted object-cover ${className}`} onError={() => setFailed(true)} />
    : <div className={`grid place-content-center place-items-center gap-2 bg-muted text-muted-foreground ${className}`}>
      <ImageOff size={24} aria-hidden="true" />
      <span className="text-xs font-medium">Imagem indisponível</span>
    </div>;
}
