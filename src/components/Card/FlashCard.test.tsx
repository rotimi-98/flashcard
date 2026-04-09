/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { FlashCard } from './FlashCard.tsx'
import type { Flashcard } from '../../types/index.ts'

afterEach(cleanup)

const card: Flashcard = {
  id: 'c1',
  yoruba: 'Omi',
  english: 'Water',
  isPreloaded: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function renderCard(overrides: Record<string, unknown> = {}) {
  const props = {
    card,
    isFlipped: false,
    onFlip: vi.fn(),
    onCorrect: vi.fn(),
    onWrong: vi.fn(),
    onSpeak: vi.fn(),
    isSpeaking: false,
    speechSupported: false,
    ...overrides,
  }
  const result = render(<FlashCard {...props} />)
  return { ...result, props }
}

function getCardButton() {
  return screen.getByRole('button', { name: /flashcard/i })
}

describe('FlashCard', () => {
  it('renders the Yoruba word on the front', () => {
    renderCard()
    expect(screen.getByText('Omi')).toBeDefined()
  })

  it('calls onFlip when the card is clicked', () => {
    const { props } = renderCard()
    fireEvent.click(getCardButton())
    expect(props.onFlip).toHaveBeenCalledTimes(1)
  })

  it('calls onFlip when Enter is pressed on the card', () => {
    const { props } = renderCard()
    fireEvent.keyDown(getCardButton(), { key: 'Enter' })
    expect(props.onFlip).toHaveBeenCalledTimes(1)
  })

  it('does not show assessment buttons when not flipped', () => {
    renderCard()
    expect(screen.queryByText(/got it/i)).toBeNull()
    expect(screen.queryByText(/still learning/i)).toBeNull()
  })

  it('shows assessment buttons when flipped', () => {
    renderCard({ isFlipped: true })
    expect(screen.getByText(/got it/i)).toBeDefined()
    expect(screen.getByText(/still learning/i)).toBeDefined()
  })

  it('fires onCorrect when "Got it" is clicked', () => {
    const { props } = renderCard({ isFlipped: true })
    fireEvent.click(screen.getByText(/got it/i))
    expect(props.onCorrect).toHaveBeenCalledTimes(1)
  })

  it('fires onWrong when "Still learning" is clicked', () => {
    const { props } = renderCard({ isFlipped: true })
    fireEvent.click(screen.getByText(/still learning/i))
    expect(props.onWrong).toHaveBeenCalledTimes(1)
  })

  it('hides assessment buttons when hideActions is true', () => {
    renderCard({ isFlipped: true, hideActions: true })
    expect(screen.queryByText(/got it/i)).toBeNull()
  })

  it('renders English translation text when flipped', () => {
    renderCard({ isFlipped: true })
    expect(screen.getByText('Water')).toBeDefined()
  })

  it('announces the translation to screen readers via aria-live', () => {
    const { container } = renderCard({ isFlipped: true })
    const live = container.querySelector('[aria-live="polite"]')
    expect(live?.textContent).toContain('Water')
  })
})
