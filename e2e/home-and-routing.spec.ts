import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('shows app title and intro copy', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Yoruba Flashcards' }),
    ).toBeVisible()
    await expect(
      page.getByText(/Learn Yoruba vocabulary with flashcards/i),
    ).toBeVisible()
  })

  test('home cards link to study, quiz, and manage cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/study"]').first()).toBeVisible()
    await expect(page.locator('a[href="/quiz"]').first()).toBeVisible()
    await expect(page.locator('a[href="/cards"]').first()).toBeVisible()
  })
})

test.describe('Navbar routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigates to Study', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Study' })
      .click()
    await expect(page).toHaveURL(/\/study$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Study mode' }),
    ).toBeVisible()
  })

  test('navigates to Quiz', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Quiz' })
      .click()
    await expect(page).toHaveURL(/\/quiz$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Quiz' }),
    ).toBeVisible()
  })

  test('navigates to Cards', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Cards' })
      .click()
    await expect(page).toHaveURL(/\/cards$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Manage cards' }),
    ).toBeVisible()
  })

  test('navigates to Stats', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Stats' })
      .click()
    await expect(page).toHaveURL(/\/stats$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Statistics' }),
    ).toBeVisible()
  })

  test('navigates to Home', async ({ page }) => {
    await page.goto('/quiz')
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Home' })
      .click()
    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Yoruba Flashcards' }),
    ).toBeVisible()
  })
})

test.describe('Direct URLs', () => {
  test('/study/redo shows redo copy', async ({ page }) => {
    await page.goto('/study/redo')
    await expect(page).toHaveURL(/\/study\/redo$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Redo wrong cards' }),
    ).toBeVisible()
    await expect(
      page.getByText(/You are in redo mode/i),
    ).toBeVisible()
  })

  test('unknown path redirects to home', async ({ page }) => {
    await page.goto('/route-that-does-not-exist-xyz')
    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Yoruba Flashcards' }),
    ).toBeVisible()
  })
})
