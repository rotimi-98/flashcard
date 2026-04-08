import { createContext, type Dispatch } from 'react'
import type { PersistedState } from '../types/index.ts'
import type { AppAction } from './appReducer.ts'

export type AppContextValue = {
  state: PersistedState
  dispatch: Dispatch<AppAction>
}

/** Initialised as `null` so `useApp` can enforce that consumers sit inside `AppProvider`. */
export const AppContext = createContext<AppContextValue | null>(null)
