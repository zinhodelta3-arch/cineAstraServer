"use client"

import { useEffect, useState } from "react"
import { useAccountPreferences } from "@/components/providers/account-preferences-provider"
import {
  ACCESSIBILITY_OPTIONS,
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY,
  applyAccessibility,
  parseAccessibility,
} from "@/lib/accessibility"

export function useAccessibility() {
  const account = useAccountPreferences()
  // O primeiro render é idêntico no servidor e no navegador.
  const [localSettings, setSettings] = useState({ ...DEFAULT_ACCESSIBILITY })
  const settings = account?.data?.acessibilidade ?? localSettings
  const [ready, setReady] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)

  useEffect(() => {
    try {
      setSettings(parseAccessibility(localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)))
    } catch {
      setStorageAvailable(false)
    }
    setReady(true)

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotion = () => setSystemReducedMotion(media.matches)
    updateMotion()
    media.addEventListener("change", updateMotion)

    const syncTabs = (event) => {
      if (event.key === ACCESSIBILITY_STORAGE_KEY || event.key === null) {
        setSettings(parseAccessibility(event.newValue))
      }
    }
    window.addEventListener("storage", syncTabs)
    return () => {
      media.removeEventListener("change", updateMotion)
      window.removeEventListener("storage", syncTabs)
    }
  }, [])

  useEffect(() => {
    if (!ready || account) return
    applyAccessibility(settings)
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings))
      setStorageAvailable(true)
    } catch {
      setStorageAvailable(false)
    }
    // Carrosséis e animações JS podem consumir este evento. CSS não pausa timers.
    window.dispatchEvent(new CustomEvent("cineastra:accessibility", {
      detail: { ...settings, reducedMotion: settings.motion || systemReducedMotion },
    }))
  }, [ready, settings, systemReducedMotion, account])

  const cycle = (key) => {
    if (!ACCESSIBILITY_OPTIONS[key]) return
    if (account) {
      void account.save({ acessibilidade: { [key]: (settings[key] + 1) % ACCESSIBILITY_OPTIONS[key].length } })
      return
    }
    setSettings((current) => ({
      ...current,
      [key]: (current[key] + 1) % ACCESSIBILITY_OPTIONS[key].length,
    }))
  }

  const toggleMotion = () => account ? account.save({ acessibilidade: { motion: !settings.motion } }) : setSettings((current) => ({ ...current, motion: !current.motion }))
  const reset = () => account ? account.save({ acessibilidade: DEFAULT_ACCESSIBILITY }) : setSettings({ ...DEFAULT_ACCESSIBILITY })
  const activeCount = Object.keys(DEFAULT_ACCESSIBILITY).filter(
    (key) => settings[key] !== DEFAULT_ACCESSIBILITY[key]
  ).length

  return {
    settings, ready: account ? Boolean(account.data) && !account.saving : ready, storageAvailable, systemReducedMotion,
    accountError: account?.error, retryAccount: account?.retry,
    accountSaving: account?.saving, synced: Boolean(account),
    activeCount, cycle, toggleMotion, reset,
  }
}
