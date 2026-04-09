import { test, expect, type Page } from '@playwright/test'

/** Seeds localStorage with a minimal state containing only 5 cards. */
async function seedFiveCards(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    const state = {
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
    localStorage.setItem('yoruba_flashcards_v1', JSON.stringify(state))
  })
}

test.describe('Study session flow', () => {
  test('completes a 5-card study session and verifies counts on summary', async ({
    page,
  }) => {
    await seedFiveCards(page)
    await page.goto('/study')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Study mode' }),
    ).toBeVisible()

    let correctPresses = 0
    let wrongPresses = 0

    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Card ${i + 1} of 5`)).toBeVisible()

      const cardBtn = page
        .getByRole('button', { name: /flashcard/i })
        .first()
      await cardBtn.click()

      if (i % 2 === 0) {
        await page.getByRole('button', { name: /got it/i }).click()
        correctPresses++
      } else {
        await page.getByRole('button', { name: /still learning/i }).click()
        wrongPresses++
      }
    }

    // Summary screen
    await expect(
      page.getByRole('heading', { name: /session complete/i }),
    ).toBeVisible()

    // Verify counts match
    const statsSection = page.locator('[class*="stats"]').first()
    await expect(statsSection.getByText(String(correctPresses))).toBeVisible()
    await expect(statsSection.getByText(String(wrongPresses))).toBeVisible()
    await expect(statsSection.getByText('Correct')).toBeVisible()
    await expect(statsSection.getByText('Wrong')).toBeVisible()
  })
})
