import { test, expect } from '@playwright/test'

test.describe('Quiz setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quiz')
  })

  test('shows quiz setup form with default selections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Quiz' }),
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Multiple Choice' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Fill in the Blank' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Yoruba → English' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Start Quiz' }),
    ).toBeVisible()
  })

  test('starts a multiple choice quiz session', async ({ page }) => {
    await page.getByRole('button', { name: 'Multiple Choice' }).click()
    await page.getByRole('button', { name: '5' }).click()
    await page.getByRole('button', { name: 'Start Quiz' }).click()

    await expect(page.getByText(/Question 1 of/i)).toBeVisible()
  })

  test('starts a fill-in-the-blank quiz session', async ({ page }) => {
    await page.getByRole('button', { name: 'Fill in the Blank' }).click()
    await page.getByRole('button', { name: '5' }).click()
    await page.getByRole('button', { name: 'Start Quiz' }).click()

    await expect(page.getByText(/Question 1 of/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Check' })).toBeVisible()
  })
})
