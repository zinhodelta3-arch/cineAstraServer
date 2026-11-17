'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAppearance } from './appearance-provider';
import { profileRequest } from '@/hooks/cinema/perfil/use-profile-resource';
import { ACCESSIBILITY_STORAGE_KEY, applyAccessibility, parseAccessibility } from '@/lib/accessibility';

const Preferences = createContext(null);
export const useAccountPreferences = () => useContext(Preferences);
export const themeMode = { CLARO: 'light', ESCURO: 'dark', SISTEMA: 'system' };

export function AccountPreferencesProvider({ userId, children }) {
  return userId ? <AccountSettings key={userId}>{children}</AccountSettings> : children;
}

function AccountSettings({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [revision, retry] = useState(0);
  const pending = useRef(false);
  const { setAppearance } = useAppearance();
  const { setTheme } = useTheme();
  const initial = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    profileRequest('preferences', 'GET', undefined, controller.signal).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => { mounted.current = false; controller.abort(); };
  }, [revision]);

  useEffect(() => {
    if (!data) return;
    if (!initial.current) {
      try {
        initial.current = {
          appearance: document.documentElement.dataset.theme,
          mode: localStorage.getItem('cineastra-mode') || 'system',
          accessibility: parseAccessibility(localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)),
        };
      } catch { initial.current = { appearance: 'cineastra', mode: 'system', accessibility: {} }; }
    }
    setAppearance(data.aparencia, false);
    setTheme(themeMode[data.tema] || 'system');
    applyAccessibility(data.acessibilidade);
    window.dispatchEvent(new CustomEvent('cineastra:accessibility', {
      detail: { ...data.acessibilidade, reducedMotion: data.acessibilidade.motion || matchMedia('(prefers-reduced-motion: reduce)').matches },
    }));
  }, [data, setAppearance, setTheme]);

  useEffect(() => () => {
    if (!initial.current) return;
    const guest = initial.current;
    setAppearance(guest.appearance, false);
    setTheme(guest.mode);
    applyAccessibility(guest.accessibility);
  }, [setAppearance, setTheme]);

  async function save(patch) {
    if (!data || pending.current) return false;
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const value = await profileRequest('preferences', 'PATCH', patch);
      if (mounted.current) setData(value);
      return true;
    } catch (cause) {
      if (mounted.current) setError(cause.message);
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return <Preferences.Provider value={{ data, error, saving, save, retry: () => { setError(''); retry(value => value + 1); } }}>{children}</Preferences.Provider>;
}
