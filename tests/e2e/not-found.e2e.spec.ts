import { test, expect } from '@playwright/test'

test.describe('404 Not Found', () => {
  test('non-existent page shows 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  })

  test('non-existent post slug shows 404', async ({ page }) => {
    await page.goto('/posts/this-post-does-not-exist')

    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  })

  test('Go home link navigates to homepage', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')

    await page.getByRole('link', { name: 'Go home' }).click()
    await page.waitForURL('/')

    await expect(page.locator('h1')).toHaveText('Welcome')
  })
})
