/**
 * Session-scoped age verification helpers.
 *
 * Uses `sessionStorage` so the gate reappears when the user opens a new
 * browser session (tab group) but persists across page navigations within
 * the same session.
 */

const VERIFIED_VALUE = 'true'

export function isAgeVerified(storageKey: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(storageKey) === VERIFIED_VALUE
  } catch {
    // sessionStorage may throw in some privacy-focused browsers
    return false
  }
}

export function setAgeVerified(storageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(storageKey, VERIFIED_VALUE)
  } catch {
    // silently fail – the gate will re-show, which is the safer default
  }
}

export function clearAgeVerified(storageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(storageKey)
  } catch {
    // noop
  }
}
