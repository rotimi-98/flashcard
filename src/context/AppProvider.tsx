import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.ts'
import type { PersistedState } from '../types/index.ts'
import { createInitialState } from '../utils/createInitialState.ts'
import { isStorageAvailable, loadState, saveState } from '../utils/storage.ts'
import { useToast } from '../components/Toast/Toast.tsx'
import { SchemaMigrationDialog } from '../components/SchemaMigrationDialog.tsx'
import { AppContext } from './app-context.ts'
import { appReducer } from './appReducer.ts'

/**
 * Resolves the boot-time state from localStorage.
 * If the stored schema is outdated, a fresh state is used and the user is
 * prompted to confirm a reset (the stale data is kept as `migrationSource`
 * so they can cancel and keep it).
 */
function getBootState(): {
  initial: PersistedState
  needsMigrationPrompt: boolean
  migrationSource: PersistedState | null
} {
  const loaded = loadState()
  if (!loaded) {
    return {
      initial: createInitialState(),
      needsMigrationPrompt: false,
      migrationSource: null,
    }
  }
  if (loaded.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return {
      initial: loaded,
      needsMigrationPrompt: false,
      migrationSource: null,
    }
  }
  return {
    initial: createInitialState(),
    needsMigrationPrompt: true,
    migrationSource: loaded,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const boot = useMemo(() => getBootState(), [])
  const [state, dispatch] = useReducer(appReducer, boot.initial)
  const { showToast } = useToast()

  const storageAvailable = useMemo(() => isStorageAvailable(), [])

  const [migrationOpen, setMigrationOpen] = useState(boot.needsMigrationPrompt)
  const migrationSourceRef = useRef(boot.migrationSource)
  // Persistence is paused while the migration dialog is open to avoid
  // overwriting stale data before the user has made a choice.
  const persistEnabledRef = useRef(!boot.needsMigrationPrompt)

  useEffect(() => {
    if (!persistEnabledRef.current || !storageAvailable) return
    try {
      saveState(state)
    } catch (e) {
      const isQuota =
        e instanceof DOMException &&
        (e.name === 'QuotaExceededError' || e.code === 22)
      if (isQuota) {
        showToast('Progress could not be saved — storage is full.')
      } else {
        console.error('saveState failed', e)
      }
    }
  }, [state, storageAvailable, showToast])

  const onMigrationConfirm = useCallback(() => {
    persistEnabledRef.current = true
    dispatch({ type: 'LOAD_STATE', payload: createInitialState() })
    migrationSourceRef.current = null
    setMigrationOpen(false)
  }, [])

  const onMigrationCancel = useCallback(() => {
    persistEnabledRef.current = true
    const src = migrationSourceRef.current
    if (src) {
      dispatch({ type: 'LOAD_STATE', payload: src })
    }
    migrationSourceRef.current = null
    setMigrationOpen(false)
  }, [])

  const value = useMemo(
    () => ({ state, dispatch, storageAvailable }),
    [state, storageAvailable],
  )

  return (
    <AppContext.Provider value={value}>
      {children}
      {migrationOpen && (
        <SchemaMigrationDialog
          onConfirm={onMigrationConfirm}
          onCancel={onMigrationCancel}
        />
      )}
    </AppContext.Provider>
  )
}
