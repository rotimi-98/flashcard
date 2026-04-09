import { test, expect, type Page } from '@playwright/test'

/** Seeds localStorage with a tiny 2-card deck. */
async function seedTwoCards(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    const state = {
      schemaVersion: 1,
      cards: [
        { id: 'tc-1', yoruba: 'Omi', english: 'Water', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
        { id: 'tc-2', yoruba: 'Ilé', english: 'House', isPreloaded: false, createdAt: '2026-01-01T00:00:00Z' },
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

test.describe('Add card and study', () => {
  test('adds a custom card via /cards, then sees it in /study', async ({
    page,
  }) => {
    await seedTwoCards(page)
    await page.goto('/cards')

    // Open the add card form
    await page
      .getByRole('button', { name: /add card/i })
      .first()
      .click()

    // Fill in the form
    await page.getByRole('textbox', { name: 'Yoruba' }).fill('Ẹ̀kọ́')
    await page.getByRole('textbox', { name: 'English' }).fill('Lesson')

    // Submit via the form's submit button
    await page
      .getByRole('form', { name: /add new card/i })
      .getByRole('button', { name: /^add card$/i })
      .click()

    // Verify the card appears in the card list
    await expect(page.getByText('Ẹ̀kọ́')).toBeVisible()

    // Navigate to study — with only 3 cards, we'll find it quickly
    await page.goto('/study')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Study mode' }),
    ).toBeVisible()

    // Go through all 3 cards flipping each one, check both the front (Yoruba)
    // and the back (English) for our custom card
    let found = false
    for (let i = 0; i < 3 && !found; i++) {
      const cardBtn = page
        .getByRole('button', { name: /flashcard/i })
        .first()
      const visible = await cardBtn.isVisible().catch(() => false)
      if (!visible) break

      // Check the front face for the Yoruba text
      if (await page.getByText('Ẹ̀kọ́').isVisible().catch(() => false)) {
        found = true
        break
      }

      // Flip to see the English side
      await cardBtn.click()

      if (await page.getByText('Lesson').isVisible().catch(() => false)) {
        found = true
        break
      }

      // Advance to next card
      await page.getByRole('button', { name: /got it/i }).click()
    }

    expect(found).toBe(true)
  })
})
