import { CURRENT_SCHEMA_VERSION } from '../constants/schema.ts'
import { defaultCards } from '../data/defaultCards.ts'
import type { PersistedState } from '../types/index.ts'
import { defaultAppSettings } from './defaultSettings.ts'

/** Fresh app state: preloaded deck, no progress, default settings, current schema. */
export function createInitialState(): PersistedState {
  return {
    cards: defaultCards.map((c) => ({ ...c })),
    records: [],
    sessions: [],
    settings: { ...defaultAppSettings },
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
}
