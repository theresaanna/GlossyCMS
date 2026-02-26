import { test, expect } from '@playwright/test'
import { POSTS, ALL_POST_TITLES } from './helpers'

test.describe('Posts Listing', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/posts')

    await expect(page).toHaveTitle(/Posts/)
  })

  test('displays Posts heading', async ({ page }) => {
    await page.goto('/posts')

    await expect(page.getByRole('heading', { level: 1, name: 'Posts' })).toBeVisible()
  })

  test('shows page range for 3 posts', async ({ page }) => {
    await page.goto('/posts')

    await expect(page.getByText(/Showing 1\s*[-–]\s*3 of 3 Posts/)).toBeVisible()
  })

  test('displays all 3 post cards', async ({ page }) => {
    await page.goto('/posts')

    for (const title of ALL_POST_TITLES) {
      await expect(page.getByText(title)).toBeVisible()
    }
  })

  test('clicking a post card navigates to the post detail page', async ({ page }) => {
    await page.goto('/posts')

    await page.getByRole('link', { name: POSTS.digitalHorizons.title }).click()
    await page.waitForURL(POSTS.digitalHorizons.url)

    await expect(
      page.getByRole('heading', { level: 1, name: POSTS.digitalHorizons.title }),
    ).toBeVisible()
  })
})
