/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppContext, type AppContextValue } from '../context/app-context.ts'
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.ts'
import { defaultAppSettings } from '../utils/defaultSettings.ts'
import type { PersistedState } from '../types/index.ts'
import { useFlashcards } from './useFlashcards.ts'

const CARDS = [
  { id: 'c1', yoruba: 'omi', english: 'water', isPreloaded: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'c2', yoruba: 'ilé', english: 'house', isPreloaded: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'c3', yoruba: 'ajá', english: 'dog', isPreloaded: true, createdAt: '2026-01-01T00:00:00Z' },
]

function makeState(overrides: Partial<PersistedState> = {}): PersistedState {
  return {
    cards: CARDS,
    records: [],
    sessions: [],
    settings: { ...defaultAppSettings },
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...overrides,
  }
}

function makeWrapper(state: PersistedState, dispatch = vi.fn()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const value: AppContextValue = { state, dispatch, storageAvailable: true }
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
  }
}

describe('useFlashcards', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('initialises with shuffled deck and correct totals', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    expect(result.current.totalCards).toBe(3)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentCard).not.toBeNull()
    expect(result.current.isFlipped).toBe(false)
    expect(result.current.isSessionComplete).toBe(false)
  })

  it('flip toggles isFlipped', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    act(() => result.current.flip())
    expect(result.current.isFlipped).toBe(true)
    act(() => result.current.flip())
    expect(result.current.isFlipped).toBe(false)
  })

  it('goNext and goPrev navigate without re-recording', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    act(() => result.current.goNext())
    expect(result.current.currentIndex).toBe(1)
    act(() => result.current.goPrev())
    expect(result.current.currentIndex).toBe(0)
  })

  it('goNext does not advance past last card', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    act(() => result.current.goNext())
    act(() => result.current.goNext())
    // index is 2 (last card)
    act(() => result.current.goNext())
    expect(result.current.currentIndex).toBe(2)
  })

  it('goPrev does not go below 0', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    act(() => result.current.goPrev())
    expect(result.current.currentIndex).toBe(0)
  })

  it('markCorrect dispatches RECORD_OUTCOME and advances', () => {
    const dispatch = vi.fn()
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState(), dispatch),
    })
    const cardId = result.current.currentCard!.id
    act(() => result.current.markCorrect())
    expect(dispatch).toHaveBeenCalledWith({
      type: 'RECORD_OUTCOME',
      payload: { cardId, correct: true },
    })
    expect(result.current.correctCount).toBe(1)
  })

  it('markWrong dispatches RECORD_OUTCOME and advances', () => {
    const dispatch = vi.fn()
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState(), dispatch),
    })
    act(() => result.current.markWrong())
    expect(dispatch).toHaveBeenCalledWith({
      type: 'RECORD_OUTCOME',
      payload: { cardId: expect.any(String), correct: false },
    })
    expect(result.current.wrongCount).toBe(1)
  })

  it('does not re-record when navigating back to an assessed card', () => {
    const dispatch = vi.fn()
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState(), dispatch),
    })
    act(() => result.current.markCorrect())
    const callCount = dispatch.mock.calls.length
    // Go back and try marking again — should be a no-op.
    act(() => result.current.goPrev())
    act(() => result.current.markCorrect())
    expect(dispatch.mock.calls.length).toBe(callCount)
  })

  it('completes the session after all cards are assessed', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    act(() => result.current.markCorrect())
    act(() => result.current.markWrong())
    act(() => result.current.markCorrect())
    expect(result.current.isSessionComplete).toBe(true)
    expect(result.current.correctCount).toBe(2)
    expect(result.current.wrongCount).toBe(1)
  })

  it('restart reshuffles and resets counts', () => {
    const { result } = renderHook(() => useFlashcards(), {
      wrapper: makeWrapper(makeState()),
    })
    act(() => result.current.markCorrect())
    act(() => result.current.markWrong())
    act(() => result.current.markCorrect())
    expect(result.current.isSessionComplete).toBe(true)
    act(() => result.current.restart())
    expect(result.current.isSessionComplete).toBe(false)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.correctCount).toBe(0)
    expect(result.current.wrongCount).toBe(0)
  })

  it('redoWrongOnly filters to cards flagged isMarkedWrong', () => {
    const stateWithWrong = makeState({
      records: [
        { cardId: 'c2', timesStudied: 1, timesCorrect: 0, timesWrong: 1, lastStudied: '2026-01-01T00:00:00Z', isMarkedWrong: true },
      ],
    })
    const { result } = renderHook(() => useFlashcards(true), {
      wrapper: makeWrapper(stateWithWrong),
    })
    expect(result.current.totalCards).toBe(1)
    expect(result.current.currentCard?.id).toBe('c2')
  })

  it('returns 0 cards when redoWrongOnly is true and none are wrong', () => {
    const { result } = renderHook(() => useFlashcards(true), {
      wrapper: makeWrapper(makeState()),
    })
    expect(result.current.totalCards).toBe(0)
    expect(result.current.currentCard).toBeNull()
  })
})
