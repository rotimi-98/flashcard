import type { Page } from '@playwright/test'

/** Minimal 5-card deck used by multiple E2E specs. */
const FIVE_CARD_STATE = {
  schemaVersion: 1,
  cards: [
    { id: 'tc-1', yoruba: 'Omi', english: 'Water', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'tc-2', yoruba: 'Ilé', english: 'House', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'tc-3', yoruba: 'Igi', english: 'Tree', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'tc-4', yoruba: 'Àgbàdo', english: 'Corn', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'tc-5', yoruba: 'Ewé', english: 'Leaf', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
  ],
  records: [],
  sessions: [],
  settings: {
    speechEnabled: true,
    speechRate: 1,
    autoFlip: false,
    autoFlipDelay: 5,
  },
}

/**
 * Seeds localStorage with a minimal 5-card state and navigates to the home page.
 * Call this before navigating to the page under test.
 */
export async function seedFiveCards(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate((state) => {
    localStorage.setItem('yoruba_flashcards_v1', JSON.stringify(state))
  }, FIVE_CARD_STATE)
}
