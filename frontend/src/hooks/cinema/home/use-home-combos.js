"use client";
import { usePublicList } from './use-public-list';
import { snackProduct } from '@/lib/api/snack-products.mjs';
import { useCinemaLocation } from '@/components/providers/cinema-location-provider';
export function useHomeCombos() {
 const { ready, location } = useCinemaLocation();
 const locations = usePublicList(ready && !location ? '/locations?limit=1&cinema=true' : null);
 const localId = ready ? location?.id_local || String(locations.items[0]?.id_local || '') : '';
 const combos = usePublicList(localId ? `/combos?localId=${localId}&limit=8` : null);
 const snacks = usePublicList(localId ? `/locations/${localId}/snacks?limit=8` : null);
 const products = [...combos.items.map(r => snackProduct(r, 'COMBO', localId)), ...snacks.items.map(r => snackProduct(r, 'INPUT', localId))].slice(0, 8);
 return { ready, localId, locations, combos, snacks, products };
}
