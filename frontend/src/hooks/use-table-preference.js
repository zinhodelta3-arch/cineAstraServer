'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSessionSnapshot } from '@/hooks/auth/use-session';

export function useTablePreference(name, defaults) {
  const session = useSessionSnapshot();
  const account = session?.user;
  const key = account && name ? `cineastra:table:v1:${account.role}:${account.id}:${name}` : null;
  const [stored, setStored] = useState(null);
  useEffect(() => {
    if (!key) return;
    try { setStored({ key, value: JSON.parse(localStorage.getItem(key)) }); }
    catch { setStored({ key, value: null }); }
  }, [key]);
  const value = stored?.key === key && stored.value != null ? stored.value : defaults;
  const change = useCallback(next => {
    setStored({ key, value: next });
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* A lista continua disponível sem armazenamento. */ }
  }, [key]);
  return [value, change, (!name || !session?.loading) && (!key || stored?.key === key), key];
}
