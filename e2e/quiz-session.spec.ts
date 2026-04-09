import { test, expect, type Page } from '@playwright/test'

/** Seeds localStorage with a minimal 5-card deck. */
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

test.describe('Quiz session flow', () => {
  test('completes a 5-question MC quiz and verifies the score on summary', async ({
    page,
  }) => {
    await seedFiveCards(page)
    await page.goto('/quiz')

    // Verify the setup screen
    await expect(
      page.getByRole('heading', { level: 1, name: 'Quiz' }),
    ).toBeVisible()

    // Select 5 questions
    await page.getByRole('button', { name: '5' }).click()

    // Start the quiz
    await page.getByRole('button', { name: 'Start Quiz' }).click()

    // Answer 5 questions by clicking the first option each time
    for (let i = 0; i < 5; i++) {
      await expect(
        page.getByText(`Question ${i + 1} of 5`),
      ).toBeVisible()

      // Click the first option button
      const firstOption = page.locator('[class*="optBtn"]').first()
      await expect(firstOption).toBeVisible()
      await firstOption.click()

      // Wait for the next question (auto-advance) or click Next
      if (i < 4) {
        // Either the next question appears automatically or we click Next
        const nextQuestion = page.getByText(`Question ${i + 2} of 5`)
        const nextBtn = page.getByRole('button', { name: /next/i })

        await Promise.race([
          nextQuestion.waitFor({ timeout: 3000 }),
          nextBtn.waitFor({ timeout: 3000 }).then(() => nextBtn.click()),
        ]).catch(() => {})
      }
    }

    // Summary screen should appear
    await expect(
      page.getByRole('heading', { name: /quiz complete/i }),
    ).toBeVisible({ timeout: 5000 })

    // Verify the score shows "/ 5"
    const scoreElement = page.locator('[class*="score"]').first()
    await expect(scoreElement).toContainText('/ 5')

    // Verify navigation buttons
    await expect(
      page.getByRole('button', { name: /new quiz/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /go home/i }),
    ).toBeVisible()
  })
})
