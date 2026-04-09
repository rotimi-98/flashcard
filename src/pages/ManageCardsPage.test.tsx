/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppContext, type AppContextValue } from '../context/app-context.ts'
import { CURRENT_SCHEMA_VERSION } from '../constants/schema.ts'
import { defaultAppSettings } from '../utils/defaultSettings.ts'
import type { PersistedState } from '../types/index.ts'
import { ManageCardsPage } from './ManageCardsPage.tsx'

afterEach(cleanup)

function baseState(over: Partial<PersistedState> = {}): PersistedState {
  return {
    cards: [
      {
        id: 'pre-1',
        yoruba: 'Omi',
        english: 'Water',
        isPreloaded: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    records: [],
    sessions: [],
    settings: { ...defaultAppSettings },
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...over,
  }
}

function renderPage(state = baseState(), dispatch = vi.fn()) {
  const value: AppContextValue = { state, dispatch, storageAvailable: true }
  const result = render(
    <MemoryRouter>
      <AppContext.Provider value={value}>
        <ManageCardsPage />
      </AppContext.Provider>
    </MemoryRouter>,
  )
  return { ...result, dispatch }
}

beforeEach(() => {
  vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-1234',
  })

  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
    configurable: true,
  })
  ;(globalThis as Record<string, unknown>).SpeechSynthesisUtterance = class {
    text: string
    lang = ''
    rate = 1
    voice = null
    onstart = null
    onend = null
    onerror = null
    constructor(text: string) {
      this.text = text
    }
  }
})

function openAddForm() {
  // The toolbar "+" button has aria-label "Add card"
  const addBtn = screen.getAllByRole('button', { name: /add card/i })[0]!
  fireEvent.click(addBtn)
}

function submitForm() {
  // The form submit button text is "Add card" — it's inside the form
  const form = screen.getByRole('form', { name: /add new card/i })
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
  fireEvent.click(submitBtn)
}

describe('CardForm via ManageCardsPage', () => {
  it('shows the form when "Add card" is clicked', () => {
    renderPage()
    openAddForm()
    expect(
      screen.getByRole('form', { name: /add new card/i }),
    ).toBeDefined()
  })

  it('shows validation errors on empty submit', () => {
    renderPage()
    openAddForm()
    submitForm()
    expect(screen.getByText('Yoruba is required')).toBeDefined()
    expect(screen.getByText('English is required')).toBeDefined()
  })

  it('dispatches ADD_CARD with correct data on valid submit', () => {
    const { dispatch } = renderPage()
    openAddForm()

    fireEvent.change(screen.getByLabelText('Yoruba'), {
      target: { value: 'Ilé' },
    })
    fireEvent.change(screen.getByLabelText('English'), {
      target: { value: 'House' },
    })
    submitForm()

    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_CARD',
      payload: { yoruba: 'Ilé', english: 'House', notes: undefined },
    })
  })

  it('closes the form after successful submit', () => {
    renderPage()
    openAddForm()

    fireEvent.change(screen.getByLabelText('Yoruba'), {
      target: { value: 'Ilé' },
    })
    fireEvent.change(screen.getByLabelText('English'), {
      target: { value: 'House' },
    })
    submitForm()

    expect(screen.queryByRole('form', { name: /add new card/i })).toBeNull()
  })
})
