export const ACCESSIBILITY_STORAGE_KEY = "cineastra-accessibility-v1"

export const DEFAULT_ACCESSIBILITY = Object.freeze({
  contrast: 0,
  font: 0,
  line: 0,
  spacing: 0,
  motion: false,
  color: 0,
})

export const ACCESSIBILITY_OPTIONS = {
  contrast: ["Original", "Alto contraste"],
  font: ["Original", "112,5%", "125%", "150%", "200%"],
  line: ["Original", "1,5", "1,75", "2"],
  spacing: ["Original", "Leve", "Médio", "Amplo"],
  color: ["Original", "Protanopia", "Deuteranopia", "Tritanopia", "Monocromático"],
}

const COLOR_VALUES = ["original", "protanopia", "deuteranopia", "tritanopia", "mono"]

// localStorage é entrada externa: aceite apenas valores conhecidos.
export function normalizeAccessibility(input) {
  const result = { ...DEFAULT_ACCESSIBILITY }
  if (!input || typeof input !== "object" || Array.isArray(input)) return result
  for (const [key, options] of Object.entries(ACCESSIBILITY_OPTIONS)) {
    if (Number.isInteger(input[key]) && input[key] >= 0 && input[key] < options.length) {
      result[key] = input[key]
    }
  }
  result.motion = input.motion === true
  return result
}

export function parseAccessibility(value) {
  try {
    return normalizeAccessibility(JSON.parse(value))
  } catch {
    return { ...DEFAULT_ACCESSIBILITY }
  }
}

export function applyAccessibility(settings, root = document.documentElement) {
  const safe = normalizeAccessibility(settings)
  root.dataset.caContrast = String(safe.contrast)
  root.dataset.caFont = String(safe.font)
  root.dataset.caLine = String(safe.line)
  root.dataset.caSpacing = String(safe.spacing)
  root.dataset.caMotion = safe.motion ? "reduce" : "system"
  root.dataset.caColor = COLOR_VALUES[safe.color]
}
