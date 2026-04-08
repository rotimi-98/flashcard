import type { PersistedState } from '../types/index.ts'

/** localStorage key for persisted app state (§5.2) */
export const STORAGE_KEY = 'yoruba_flashcards_v1'

/**
 * Reads and parses persisted state. Returns `null` if the key is absent or JSON is invalid.
 */
export function loadState(): PersistedState | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

/**
 * Serialises and saves state.
 * Throws on failure (e.g. QuotaExceededError) so callers can surface it to the user.
 */
export function saveState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
