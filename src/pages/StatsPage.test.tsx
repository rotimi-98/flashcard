/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppContext, type AppContextValue } from '../context/app-context.ts'
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.ts'
import { defaultAppSettings } from '../utils/defaultSettings.ts'
import type { CardRecord, PersistedState, StudySession } from '../types/index.ts'
import { StatsPage } from './StatsPage.tsx'

afterEach(cleanup)

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

function baseState(over: Partial<PersistedState> = {}): PersistedState {
  return {
    cards: [
      { id: 'c1', yoruba: 'Omi', english: 'Water', isPreloaded: true, createdAt: '2026-01-01' },
      { id: 'c2', yoruba: 'Ilé', english: 'House', isPreloaded: true, createdAt: '2026-01-01' },
      { id: 'c3', yoruba: 'Igi', english: 'Tree', isPreloaded: true, createdAt: '2026-01-01' },
    ],
    records: [],
    sessions: [],
    settings: { ...defaultAppSettings },
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...over,
  }
}

function renderPage(state: PersistedState) {
  const value: AppContextValue = {
    state,
    dispatch: vi.fn(),
    storageAvailable: true,
  }
  return render(
    <MemoryRouter>
      <AppContext.Provider value={value}>
        <StatsPage />
      </AppContext.Provider>
    </MemoryRouter>,
  )
}

function kpiValue(label: string): string {
  const labels = screen.getAllByText(label)
  const kpiLabel = labels[0]!
  return kpiLabel.closest('div')!.textContent ?? ''
}

describe('StatsPage KPI values', () => {
  it('shows correct Total Cards count', () => {
    renderPage(baseState())
    expect(kpiValue('Total Cards')).toContain('3')
  })

  it('shows Cards Studied based on records', () => {
    const records: CardRecord[] = [
      { cardId: 'c1', timesStudied: 5, timesCorrect: 4, timesWrong: 1, lastStudied: '2026-01-01', isMarkedWrong: false },
      { cardId: 'c2', timesStudied: 3, timesCorrect: 3, timesWrong: 0, lastStudied: '2026-01-01', isMarkedWrong: false },
    ]
    renderPage(baseState({ records }))
    expect(kpiValue('Cards Studied')).toContain('2')
  })

  it('shows Sessions count (only completed sessions)', () => {
    const sessions: StudySession[] = [
      { id: 's1', startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T00:10:00Z', mode: 'flashcard', totalCards: 3, correctCount: 2, wrongCount: 1 },
      { id: 's2', startedAt: '2026-01-01T01:00:00Z', mode: 'flashcard', totalCards: 3, correctCount: 0, wrongCount: 0 },
    ]
    renderPage(baseState({ sessions }))
    expect(kpiValue('Sessions')).toContain('1')
  })

  it('calculates overall accuracy correctly', () => {
    const records: CardRecord[] = [
      { cardId: 'c1', timesStudied: 10, timesCorrect: 8, timesWrong: 2, lastStudied: '2026-01-01', isMarkedWrong: false },
    ]
    renderPage(baseState({ records }))
    expect(kpiValue('Accuracy')).toContain('80%')
  })

  it('shows mastered count (≥3 studied, ≥80% correct)', () => {
    const records: CardRecord[] = [
      { cardId: 'c1', timesStudied: 5, timesCorrect: 5, timesWrong: 0, lastStudied: '2026-01-01', isMarkedWrong: false },
      { cardId: 'c2', timesStudied: 3, timesCorrect: 3, timesWrong: 0, lastStudied: '2026-01-01', isMarkedWrong: false },
      { cardId: 'c3', timesStudied: 2, timesCorrect: 2, timesWrong: 0, lastStudied: '2026-01-01', isMarkedWrong: false },
    ]
    renderPage(baseState({ records }))
    expect(kpiValue('Mastered')).toContain('2')
  })

  it('shows to-revisit count (isMarkedWrong)', () => {
    const records: CardRecord[] = [
      { cardId: 'c1', timesStudied: 1, timesCorrect: 0, timesWrong: 1, lastStudied: '2026-01-01', isMarkedWrong: true },
      { cardId: 'c2', timesStudied: 1, timesCorrect: 1, timesWrong: 0, lastStudied: '2026-01-01', isMarkedWrong: false },
    ]
    renderPage(baseState({ records }))
    expect(kpiValue('To Revisit')).toContain('1')
  })

  it('shows dash for accuracy when no attempts', () => {
    renderPage(baseState())
    expect(kpiValue('Accuracy')).toContain('—')
  })
})
