"use client";

import { useEffect, useState } from 'react';
import { usePublicList } from '@/hooks/cinema/home/use-public-list';
import { publicGet, safeLink } from '@/lib/api/public-api.mjs';
import { experienceImage } from '@/lib/api/experience-inquiry.mjs';

const adapt = item => ({
  ...item,
  imageUrl: experienceImage(item),
  imageAlt: item.imageAlt ?? (item.slug === 'sala-vip' && !item.imageUrl ? 'Poltronas vermelhas em uma sala de cinema' : ''),
  targetUrl: safeLink(item.targetUrl),
  details: item.details || [],
});

export default function useCinemaExperiences() {
  const list = usePublicList('/experiences?limit=12');
  useEffect(() => {
    if (!list.items.length) return;
    const hash = window.location.hash.slice(1);
    if (!/^experiencia-[1-9]\d*$/.test(hash)) return;
    const card = document.getElementById(hash);
    card?.scrollIntoView({ block: 'start' });
    card?.focus({ preventScroll: true });
  }, [list.items]);
  return { list, experiences: list.items.map(adapt) };
}

export function useExperienceDetails(id) {
  const [revision, refresh] = useState(0);
  const [state, setState] = useState(null);
  const key = `${id}:${revision}`;
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    publicGet(`/experiences/${id}`, { signal: controller.signal })
      .then(item => { if (!controller.signal.aborted) setState({ key, item: adapt(item) }); })
      .catch(error => { if (!controller.signal.aborted) setState({ key, error: error.message }); });
    return () => controller.abort();
  }, [id, key]);
  const current = state?.key === key ? state : null;
  return { item: current?.item, error: current?.error, loading: Boolean(id && !current), retry: () => refresh(value => value + 1) };
}
