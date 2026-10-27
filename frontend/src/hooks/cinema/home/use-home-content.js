"use client";
import { usePublicList } from './use-public-list';
import { publicAsset, safeLink } from '@/lib/api/public-api.mjs';
export function useHomeContent(kind) {
 const list = usePublicList(kind === 'banners' ? '/banners?placement=cinema-home&limit=6' : '/experiences?limit=6');
 return { ...list, items: list.items.map(item => ({ ...item, imageUrl: publicAsset(item.imageUrl), targetUrl: safeLink(item.targetUrl) })) };
}
