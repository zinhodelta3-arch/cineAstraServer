"use client";
import { useState } from 'react';
import { usePublicList } from './use-public-list';
import { snackProduct } from '@/lib/api/snack-products.mjs';
export function useHomeCombos() {
 const [chosenLocalId, setLocalId] = useState('');
 const locations = usePublicList('/locations?limit=100');
 const localId = chosenLocalId || String(locations.items[0]?.id_local || '');
 const combos = usePublicList(localId ? `/combos?localId=${localId}&limit=8` : null);
 const snacks = usePublicList(localId ? `/locations/${localId}/snacks?limit=8` : null);
 const products = [...combos.items.map(r => snackProduct(r, 'COMBO', localId)), ...snacks.items.map(r => snackProduct(r, 'INPUT', localId))].slice(0, 8);
 return { localId, setLocalId, locations, combos, snacks, products };
}
