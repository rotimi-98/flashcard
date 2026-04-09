import { test, expect } from '@playwright/test'

test.describe('Redo wrong cards', () => {
  test('empty redo shows friendly message and link to study', async ({
    page,
  }) => {
    await page.goto('/study/redo')

    await expect(
      page.getByRole('heading', { name: 'No cards to redo!' }),
    ).toBeVisible()
    await expect(
      page.getByText(/you don't have any wrong cards/i),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Study all cards' }),
    ).toBeVisible()
  })

  test('study session marks wrong → redo filters to wrong cards only', async ({
    page,
  }) => {
    await page.goto('/study')

    // The study page should show the first card.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Study mode' }),
    ).toBeVisible()
    const cardButton = page.getByRole('button', { name: /flashcard/i }).first()
    await expect(cardButton).toBeVisible()

    // Flip the card to reveal the answer.
    await cardButton.click()

    // Mark it wrong.
    const wrongBtn = page.getByRole('button', { name: /still learning/i })
    await expect(wrongBtn).toBeVisible()
    await wrongBtn.click()

    // After marking, the session advances. Navigate to redo.
    await page.goto('/study/redo')

    // Redo should now have cards (not the empty state).
    await expect(
      page.getByRole('heading', { level: 1, name: 'Redo wrong cards' }),
    ).toBeVisible()
    await expect(page.getByText(/Card 1 of/i)).toBeVisible()
  })

  test('marking correct in redo clears wrong flag', async ({ page }) => {
    // First mark a card wrong in regular study.
    await page.goto('/study')
    const cardButton = page.getByRole('button', { name: /flashcard/i }).first()
    await cardButton.click()
    await page.getByRole('button', { name: /still learning/i }).click()

    // Go to redo.
    await page.goto('/study/redo')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Redo wrong cards' }),
    ).toBeVisible()

    // Flip and mark correct.
    const redoCard = page
      .getByRole('button', { name: /flashcard/i })
      .first()
    await redoCard.click()
    await page.getByRole('button', { name: /got it/i }).click()

    // Session should complete (was only 1 wrong card).
    await expect(
      page.getByRole('heading', { name: /session complete/i }),
    ).toBeVisible()

    // Now revisiting redo should show the empty state again.
    await page.goto('/study/redo')
    await expect(
      page.getByRole('heading', { name: 'No cards to redo!' }),
    ).toBeVisible()
  })
})
