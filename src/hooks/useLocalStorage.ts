import { useCallback, useState } from 'react'

/**
 * Generic localStorage-backed state. Falls back to in-memory state when storage is missing or throws.
 * @see docs/yoruba-flashcards-spec.md §7.3
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage unavailable')
      }
      const raw = localStorage.getItem(key)
      if (raw === null) {
        return initialValue
      }
      return JSON.parse(raw) as T
    } catch {
      console.warn(
        `[useLocalStorage] Unreadable or unavailable storage for key "${key}"; using in-memory fallback.`,
      )
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      setStored(value)
      try {
        if (typeof localStorage === 'undefined') {
          throw new Error('localStorage unavailable')
        }
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        console.warn(
          `[useLocalStorage] Could not persist key "${key}"; state is in-memory only.`,
        )
      }
    },
    [key],
  )

  return [stored, setValue]
}
