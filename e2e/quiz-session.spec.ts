import { test, expect } from '@playwright/test'
import { seedFiveCards } from './fixtures.ts'

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

      // Click the first answer option within the answer group
      const answerGroup = page.getByRole('group', { name: 'Answer options' })
      const firstOption = answerGroup.getByRole('button').first()
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
    await expect(page.getByText(/\/ 5/)).toBeVisible()

    // Verify navigation buttons
    await expect(
      page.getByRole('button', { name: /new quiz/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /go home/i }),
    ).toBeVisible()
  })
})
