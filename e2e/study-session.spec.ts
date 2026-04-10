import { test, expect } from '@playwright/test'
import { seedFiveCards } from './fixtures.ts'

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

    await expect(page.getByText('Correct', { exact: true })).toBeVisible()
    await expect(page.getByText('Wrong', { exact: true })).toBeVisible()
  })
})
