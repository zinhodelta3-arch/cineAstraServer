'use client';

import { useEffect, useState } from 'react';
import { publicAsset, publicGet } from '@/lib/api/public-api.mjs';

const mediaByDevice = [
  ['DESKTOP', '(min-width: 1024px)', 'lg:object-cover'],
  ['TABLET', '(min-width: 768px) and (max-width: 1023.98px)', 'md:max-lg:object-cover'],
  ['MOBILE', '(max-width: 767.98px)', 'max-md:object-cover']
];

export default function ResponsiveFilmBanner({ filmId, context, legacyBanner, cover, className = '', imagePosition = 'object-[72%_center]', active = true }) {
  const [selection, setSelection] = useState(null);
  const [failed, setFailed] = useState([]);
  const key = `${filmId}:${context}`;
  const current = selection?.key === key ? selection : null;
  const loaded = Boolean(current);

  useEffect(() => {
    if (!active || !filmId || loaded) return;
    const controller = new AbortController();
    publicGet(`/films/${encodeURIComponent(filmId)}/banners?context=${encodeURIComponent(context)}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setSelection({ key, data }); })
      .catch(() => { if (!controller.signal.aborted) setSelection({ key, data: null }); });
    return () => controller.abort();
  }, [filmId, context, key, active, loaded]);

  if (!active && !loaded) return null;
  const data = current?.data;
  const available = src => src && !failed.includes(src);
  const sources = mediaByDevice.map(([device, media, fit]) => [publicAsset(data?.variants?.[device]), media, fit])
    .filter(([src]) => available(src));
  const fallback = [data ? publicAsset(data.defaultBanner) : legacyBanner, publicAsset(data?.cover), cover].find(available);
  const base = fallback || '/Logominimalista.png';

  function handleError(event) {
    const image = event.currentTarget;
    const failedUrl = image.currentSrc || image.src;
    const source = [...sources.map(([src]) => src), base].find(src => new URL(src, document.baseURI).href === failedUrl);
    if (source && (fallback || source !== base)) setFailed(previous => previous.includes(source) ? previous : [...previous, source]);
  }

  return <div className={`absolute inset-0 overflow-hidden bg-muted ${className}`} aria-hidden="true">
    <picture key={JSON.stringify([sources, base])} className="block size-full">
      {sources.map(([src, media]) => <source key={media} media={media} srcSet={src} />)}
      <img src={base} alt="" onError={handleError} fetchPriority={active ? 'high' : 'auto'} className={`size-full ${imagePosition} ${fallback ? 'object-cover' : `object-scale-down ${sources.map(([, , fit]) => fit).join(' ')}`}`} />
    </picture>
  </div>;
}
