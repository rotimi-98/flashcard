import type {
  AppSettings,
  Flashcard,
  PersistedState,
  StudySession,
} from '../types/index.ts'

export type AppAction =
  | {
      type: 'ADD_CARD'
      payload: { yoruba: string; english: string; notes?: string }
    }
  | {
      type: 'EDIT_CARD'
      payload: { id: string; yoruba: string; english: string; notes?: string }
    }
  | { type: 'DELETE_CARD'; payload: { id: string } }
  | { type: 'RECORD_OUTCOME'; payload: { cardId: string; correct: boolean } }
  | {
      type: 'START_SESSION'
      payload: Omit<StudySession, 'id'> & { id?: string }
    }
  | {
      type: 'END_SESSION'
      payload: { id: string; endedAt?: string }
    }
  | { type: 'RESET_WRONG_FLAGS'; payload: { cardIds: string[] } }
  | { type: 'RESET_ALL_PROGRESS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'LOAD_STATE'; payload: PersistedState }

/** Pure reducer — every case returns a new state object without side effects. */
export function appReducer(state: PersistedState, action: AppAction): PersistedState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload

    case 'ADD_CARD': {
      const { yoruba, english, notes } = action.payload
      const card: Flashcard = {
        id: crypto.randomUUID(),
        yoruba,
        english,
        notes,
        isPreloaded: false,
        createdAt: new Date().toISOString(),
      }
      return { ...state, cards: [...state.cards, card] }
    }

    case 'EDIT_CARD': {
      const { id, yoruba, english, notes } = action.payload
      return {
        ...state,
        cards: state.cards.map((c) => {
          if (c.id !== id || c.isPreloaded) return c
          return {
            ...c,
            yoruba,
            english,
            ...(notes !== undefined ? { notes } : {}),
          }
        }),
      }
    }

    case 'DELETE_CARD': {
      const { id } = action.payload
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== id || c.isPreloaded),
        records: state.records.filter((r) => r.cardId !== id),
      }
    }

    case 'RECORD_OUTCOME': {
      const { cardId, correct } = action.payload
      const now = new Date().toISOString()
      const idx = state.records.findIndex((r) => r.cardId === cardId)
      const prev =
        idx >= 0
          ? state.records[idx]!
          : {
              cardId,
              timesStudied: 0,
              timesCorrect: 0,
              timesWrong: 0,
              lastStudied: now,
              isMarkedWrong: false,
            }
      const next = {
        ...prev,
        timesStudied: prev.timesStudied + 1,
        timesCorrect: prev.timesCorrect + (correct ? 1 : 0),
        timesWrong: prev.timesWrong + (correct ? 0 : 1),
        isMarkedWrong: !correct,
        lastStudied: now,
      }
      const records = [...state.records]
      if (idx >= 0) records[idx] = next
      else records.push(next)
      return { ...state, records }
    }

    case 'START_SESSION': {
      const incoming = action.payload
      const session: StudySession = {
        ...incoming,
        id: incoming.id ?? crypto.randomUUID(),
      }
      return { ...state, sessions: [...state.sessions, session] }
    }

    case 'END_SESSION': {
      const endedAt = action.payload.endedAt ?? new Date().toISOString()
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload.id ? { ...s, endedAt } : s,
        ),
      }
    }

    case 'RESET_WRONG_FLAGS': {
      const set = new Set(action.payload.cardIds)
      return {
        ...state,
        records: state.records.map((r) =>
          set.has(r.cardId) ? { ...r, isMarkedWrong: false } : r,
        ),
      }
    }

    case 'RESET_ALL_PROGRESS': {
      return {
        ...state,
        records: [],
        sessions: [],
      }
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    }
  }
}
