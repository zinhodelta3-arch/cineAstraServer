"use client";
import { usePublicList } from './use-public-list';
import { publicAsset, safeLink } from '@/lib/api/public-api.mjs';
import { experienceImage } from '@/lib/api/experience-inquiry.mjs';
export function useHomeContent(kind, placement = 'cinema-home') {
 const list = usePublicList(kind === 'banners' ? `/banners?placement=${placement}&limit=6` : '/experiences?limit=6');
 return { ...list, items: list.items.map(item => ({ ...item, imageUrl: kind === 'banners' ? publicAsset(item.imageUrl) : experienceImage(item), targetUrl: safeLink(item.targetUrl) })) };
}
