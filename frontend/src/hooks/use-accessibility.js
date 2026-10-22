"use client"

import { useEffect, useState } from "react"
import {
  ACCESSIBILITY_OPTIONS,
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY,
  applyAccessibility,
  parseAccessibility,
} from "@/lib/accessibility"

export function useAccessibility() {
  // O primeiro render é idêntico no servidor e no navegador.
  const [settings, setSettings] = useState({ ...DEFAULT_ACCESSIBILITY })
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
    if (!ready) return
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
  }, [ready, settings, systemReducedMotion])

  const cycle = (key) => {
    if (!ACCESSIBILITY_OPTIONS[key]) return
    setSettings((current) => ({
      ...current,
      [key]: (current[key] + 1) % ACCESSIBILITY_OPTIONS[key].length,
    }))
  }

  const toggleMotion = () => setSettings((current) => ({ ...current, motion: !current.motion }))
  const reset = () => setSettings({ ...DEFAULT_ACCESSIBILITY })
  const activeCount = Object.keys(DEFAULT_ACCESSIBILITY).filter(
    (key) => settings[key] !== DEFAULT_ACCESSIBILITY[key]
  ).length

  return {
    settings, ready, storageAvailable, systemReducedMotion,
    activeCount, cycle, toggleMotion, reset,
  }
}
