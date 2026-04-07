import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.ts'
import { defaultCards } from '../data/defaultCards.ts'
import type { PersistedState } from '../types/index.ts'
import { defaultAppSettings } from '../utils/defaultSettings.ts'
import { appReducer } from './appReducer.ts'

function baseState(over: Partial<PersistedState> = {}): PersistedState {
  return {
    cards: defaultCards.slice(0, 3).map((c) => ({ ...c })),
    records: [],
    sessions: [],
    settings: { ...defaultAppSettings },
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...over,
  }
}

describe('appReducer', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      randomUUID: () => '00000000-0000-4000-8000-00000000abcd',
    })
  })

  it('LOAD_STATE replaces entire state', () => {
    const a = baseState()
    const b = baseState({ schemaVersion: 99 })
    expect(appReducer(a, { type: 'LOAD_STATE', payload: b })).toEqual(b)
  })

  it('ADD_CARD appends a user card', () => {
    const s = baseState()
    const next = appReducer(s, {
      type: 'ADD_CARD',
      payload: { yoruba: 'tèstì', english: 'test' },
    })
    expect(next.cards).toHaveLength(s.cards.length + 1)
    const added = next.cards[next.cards.length - 1]!
    expect(added.isPreloaded).toBe(false)
    expect(added.yoruba).toBe('tèstì')
    expect(added.id).toBe('00000000-0000-4000-8000-00000000abcd')
  })

  it('EDIT_CARD updates only non-preloaded cards', () => {
    const pre = defaultCards[0]!
    const user = {
      id: 'user-1',
      yoruba: 'x',
      english: 'y',
      isPreloaded: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    const s = baseState({ cards: [pre, user] })
    const next = appReducer(s, {
      type: 'EDIT_CARD',
      payload: { id: pre.id, yoruba: 'nope', english: 'no' },
    })
    expect(next.cards[0]!.yoruba).toBe(pre.yoruba)
    const next2 = appReducer(s, {
      type: 'EDIT_CARD',
      payload: { id: user.id, yoruba: 'yy', english: 'zz', notes: 'n' },
    })
    expect(next2.cards.find((c) => c.id === user.id)!.yoruba).toBe('yy')
    expect(next2.cards.find((c) => c.id === user.id)!.notes).toBe('n')
  })

  it('DELETE_CARD removes user cards and records', () => {
    const user = {
      id: 'user-1',
      yoruba: 'x',
      english: 'y',
      isPreloaded: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    const s = baseState({
      cards: [defaultCards[0]!, user],
      records: [{ cardId: user.id, timesStudied: 1, timesCorrect: 0, timesWrong: 1, lastStudied: '2026-01-01T00:00:00.000Z', isMarkedWrong: true }],
    })
    const next = appReducer(s, { type: 'DELETE_CARD', payload: { id: user.id } })
    expect(next.cards.some((c) => c.id === user.id)).toBe(false)
    expect(next.records.some((r) => r.cardId === user.id)).toBe(false)
  })

  it('RECORD_OUTCOME creates and updates CardRecord', () => {
    const id = defaultCards[0]!.id
    let s = baseState()
    s = appReducer(s, {
      type: 'RECORD_OUTCOME',
      payload: { cardId: id, correct: true },
    })
    expect(s.records).toHaveLength(1)
    expect(s.records[0]!.timesStudied).toBe(1)
    expect(s.records[0]!.timesCorrect).toBe(1)
    expect(s.records[0]!.isMarkedWrong).toBe(false)
    s = appReducer(s, {
      type: 'RECORD_OUTCOME',
      payload: { cardId: id, correct: false },
    })
    expect(s.records[0]!.timesStudied).toBe(2)
    expect(s.records[0]!.timesWrong).toBe(1)
    expect(s.records[0]!.isMarkedWrong).toBe(true)
  })

  it('START_SESSION and END_SESSION update sessions', () => {
    let s = baseState()
    s = appReducer(s, {
      type: 'START_SESSION',
      payload: {
        mode: 'flashcard',
        startedAt: '2026-01-01T00:00:00.000Z',
        totalCards: 5,
        correctCount: 0,
        wrongCount: 0,
      },
    })
    expect(s.sessions).toHaveLength(1)
    const sid = s.sessions[0]!.id
    s = appReducer(s, {
      type: 'END_SESSION',
      payload: { id: sid, endedAt: '2026-01-01T01:00:00.000Z' },
    })
    expect(s.sessions[0]!.endedAt).toBe('2026-01-01T01:00:00.000Z')
  })

  it('RESET_WRONG_FLAGS clears flags for listed ids', () => {
    const id = defaultCards[0]!.id
    const s = baseState({
      records: [
        {
          cardId: id,
          timesStudied: 1,
          timesCorrect: 0,
          timesWrong: 1,
          lastStudied: '2026-01-01T00:00:00.000Z',
          isMarkedWrong: true,
        },
      ],
    })
    const next = appReducer(s, {
      type: 'RESET_WRONG_FLAGS',
      payload: { cardIds: [id] },
    })
    expect(next.records[0]!.isMarkedWrong).toBe(false)
  })

  it('RESET_ALL_PROGRESS clears records and sessions', () => {
    const s = baseState({
      records: [
        {
          cardId: 'x',
          timesStudied: 1,
          timesCorrect: 1,
          timesWrong: 0,
          lastStudied: '2026-01-01T00:00:00.000Z',
          isMarkedWrong: false,
        },
      ],
      sessions: [
        {
          id: 's1',
          startedAt: '2026-01-01T00:00:00.000Z',
          mode: 'flashcard',
          totalCards: 1,
          correctCount: 1,
          wrongCount: 0,
        },
      ],
    })
    const next = appReducer(s, { type: 'RESET_ALL_PROGRESS' })
    expect(next.records).toEqual([])
    expect(next.sessions).toEqual([])
    expect(next.cards.length).toBe(s.cards.length)
  })

  it('UPDATE_SETTINGS merges settings', () => {
    const s = baseState()
    const next = appReducer(s, {
      type: 'UPDATE_SETTINGS',
      payload: { speechRate: 1.0, speechEnabled: false },
    })
    expect(next.settings.speechRate).toBe(1.0)
    expect(next.settings.speechEnabled).toBe(false)
  })
})
