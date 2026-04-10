/**
 * Shared TypeScript interfaces for Yoruba Flashcards persisted and runtime state.
 * @see docs/yoruba-flashcards-spec.md §5.1
 */

/** A single flashcard entry */
export interface Flashcard {
  /** UUID (crypto.randomUUID()) */
  id: string
  /** Word or phrase in Yoruba (with tone marks) */
  yoruba: string
  /** English translation */
  english: string
  /** Optional context or example sentence */
  notes?: string
  /** true = came from defaultCards.ts; false = user-created */
  isPreloaded: boolean
  /** ISO 8601 timestamp */
  createdAt: string
}

/** Per-card performance record stored in localStorage */
export interface CardRecord {
  cardId: string
  timesStudied: number
  timesCorrect: number
  timesWrong: number
  /** ISO 8601 timestamp */
  lastStudied: string
  /** true = flagged for "redo wrong cards" session */
  isMarkedWrong: boolean
}

/** Aggregated session statistics */
export interface StudySession {
  id: string
  /** ISO 8601 timestamp */
  startedAt: string
  /** ISO 8601 timestamp */
  endedAt?: string
  mode: 'flashcard' | 'quiz-multiple-choice' | 'quiz-fill-blank' | 'redo-wrong'
  totalCards: number
  correctCount: number
  wrongCount: number
}

/** Application settings */
export interface AppSettings {
  speechEnabled: boolean
  /** 0.5 – 1.5 (default: 0.85) */
  speechRate: number
  /** SpeechSynthesis voice name, if overridden */
  speechVoice?: string
  /** Auto-flip card after N seconds (false by default) */
  autoFlip: boolean
  /** Seconds before auto-flip (default: 3) */
  autoFlipDelay: number
}

/** Root shape of localStorage state */
export interface PersistedState {
  cards: Flashcard[]
  records: CardRecord[]
  sessions: StudySession[]
  settings: AppSettings
  /** Increment when breaking changes are made to the shape */
  schemaVersion: number
}
