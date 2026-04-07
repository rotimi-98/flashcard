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
import { loadState, saveState } from '../utils/storage.ts'
import { SchemaMigrationDialog } from '../components/SchemaMigrationDialog.tsx'
import { AppContext } from './app-context.ts'
import { appReducer } from './appReducer.ts'

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

  const [migrationOpen, setMigrationOpen] = useState(boot.needsMigrationPrompt)
  const migrationSourceRef = useRef(boot.migrationSource)
  const persistEnabledRef = useRef(!boot.needsMigrationPrompt)

  useEffect(() => {
    if (!persistEnabledRef.current) return
    try {
      saveState(state)
    } catch (e) {
      console.error('saveState failed', e)
    }
  }, [state])

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

  const value = useMemo(() => ({ state, dispatch }), [state])

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
