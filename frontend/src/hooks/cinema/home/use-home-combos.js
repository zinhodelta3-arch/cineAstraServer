"use client";
import { useState } from 'react';
import { usePublicList } from './use-public-list';
export function useHomeCombos() {
 const [localId, setLocalId] = useState('');
 const locations = usePublicList('/locations?limit=100');
 const combos = usePublicList(localId ? `/combos?localId=${localId}&limit=8` : null);
 return { localId, setLocalId, locations, combos };
}
