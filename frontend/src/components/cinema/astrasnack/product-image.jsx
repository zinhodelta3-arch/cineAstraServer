'use client';

import { Popcorn } from 'lucide-react';
import { useLocationImage } from '@/hooks/cinema/localizacoes/use-location-image';

export default function ProductImage({src,alt='',className='',fit='object-cover'}){
  const {failed,onError}=useLocationImage(src);
  return src&&!failed
    ? <img src={src} alt={alt} loading="lazy" decoding="async" onError={onError} className={`${fit} ${className}`} />
    : <span className={`grid place-items-center bg-muted text-muted-foreground ${className}`} aria-hidden="true"><Popcorn className="size-1/2 max-w-12" /></span>;
}
